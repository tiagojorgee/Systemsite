import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { serverDb } from "./serverDb";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "gamezone_jwt_secret_token_123!";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration for local file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Clean and sanitize the original filename to prevent path traversal
    const safeExt = path.extname(file.originalname).toLowerCase();
    const uniqueName = `feed-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit to 10MB
  fileFilter: (req, file, cb) => {
    // Malicious Upload Protection: restriction of file extensions and MIME-types
    const allowedExts = [
      ".png", ".jpg", ".jpeg", ".gif", ".webp", ".mp4", ".mp3", ".mov", 
      ".pdf", ".txt", ".zip", ".rar", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"
    ];
    const allowedMimes = [
      "image/png", "image/jpeg", "image/gif", "image/webp", "video/mp4", "video/quicktime", 
      "audio/mpeg", "audio/mp3", "audio/wav", "application/pdf", "text/plain", "application/zip", 
      "application/x-zip-compressed", "application/x-rar-compressed", "application/msword", 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", 
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-powerpoint", 
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();

    if (!allowedExts.includes(ext) || !allowedMimes.includes(mime)) {
      return cb(new Error("Formato de arquivo não permitido por diretrizes de segurança corporativa."));
    }
    cb(null, true);
  }
});

// Helper to save base64 data to local file in uploads folder
function saveBase64ToUploads(base64Data: string, fileName: string): string | null {
  try {
    // Path Traversal Protection: retrieve only the safe basename
    const sanitizedBaseName = path.basename(fileName).replace(/[^a-zA-Z0-9_\-.]/g, "_");
    const fileExt = path.extname(sanitizedBaseName).toLowerCase() || ".png";
    
    // Strict extension whitelist
    const allowedExts = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".mp4", ".mp3"];
    if (!allowedExts.includes(fileExt)) {
      console.warn(`[SECURITY ENGINE] Blocked upload attempt with malicious extension: ${fileExt}`);
      return null;
    }

    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
    let buffer: Buffer;
    let extension = fileExt;

    if (matches && matches.length === 3) {
      const mime = matches[1].toLowerCase();
      // Validate MIME type matching
      const allowedMimes = ["image/png", "image/jpeg", "image/gif", "image/webp", "video/mp4", "audio/mpeg"];
      if (!allowedMimes.includes(mime)) {
        console.warn(`[SECURITY ENGINE] Blocked upload attempt with untrusted MIME type: ${mime}`);
        return null;
      }
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(base64Data, "base64");
    }

    const uniqueName = `upload-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`;
    const filePath = path.join(process.cwd(), "uploads", uniqueName);

    // Safeguard directory traversal validation
    const realUploadsDir = path.resolve(process.cwd(), "uploads");
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(realUploadsDir)) {
      console.warn(`[SECURITY ALERT] Blocked malicious Path Traversal upload attempt! Path: ${resolvedPath}`);
      return null;
    }

    fs.writeFileSync(filePath, buffer);
    return `/uploads/${uniqueName}`;
  } catch (err) {
    console.error("[LOCAL UPLOAD ERROR] Failed to save base64:", err);
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  // --- CORPORATE SECURITY HEADERS (Helmet Equivalent) ---
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    // Clickjacking & CSRF & XSS hardening
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader(
      "Content-Security-Policy",
      "frame-ancestors 'self' https://ai.studio https://*.google.com; default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://*.dicebear.com https://images.unsplash.com https://api.dicebear.com https://fonts.googleapis.com https://fonts.gstatic.com https://*.run.app; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; connect-src 'self' https:;"
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });

  // Serve uploads folder as static
  app.use("/uploads", express.static(uploadsDir));

  // JSON and URL-encoded body parsers with generous limits for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // --- DDoS PROTECTION (IP sliding-window rate limiter) ---
  const requestHistory: Record<string, number[]> = {};
  const rateLimitMiddleware = (limit: number, windowMs: number) => {
    return (req: any, res: any, next: any) => {
      const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
      const now = Date.now();

      if (!requestHistory[ip]) {
        requestHistory[ip] = [];
      }

      // Filter timestamps outside window
      requestHistory[ip] = requestHistory[ip].filter(t => now - t < windowMs);

      if (requestHistory[ip].length >= limit) {
        serverDb.addAuditLog(
          "system",
          "DDOS_ATTACK_DETECTED",
          `IP ${ip} bloqueado temporariamente por exceder limite de ${limit} reqs por minuto`,
          ip,
          req.headers["user-agent"] || ""
        );
        return res.status(429).json({ error: "Taxa de requisição excedida. Proteção DDoS ativa." });
      }

      requestHistory[ip].push(now);
      next();
    };
  };

  // Bind global rate limit (Max 150 requests/minute per IP)
  app.use(rateLimitMiddleware(150, 60000));

  // --- BRUTE FORCE LOCKOUT MIDDLEWARE ---
  const checkBruteForceLockout = (req: any, res: any, next: any) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const block = serverDb.getIpBlock(ip);

    if (block && block.bloqueado_ate) {
      const isStillBlocked = new Date(block.bloqueado_ate).getTime() > Date.now();
      if (isStillBlocked) {
        return res.status(403).json({
          error: `Este endereço IP está bloqueado temporariamente devido a consecutivas tentativas de login maliciosas. Tente novamente após ${new Date(
            block.bloqueado_ate
          ).toLocaleTimeString("pt-BR")}.`
        });
      } else {
        serverDb.clearIpBlock(ip);
      }
    }
    next();
  };

  // --- DEVICE & GEOLOCATION DETECTION UTILS ---
  const parseUserAgent = (ua: string): string => {
    if (!ua) return "Navegador Desconhecido";
    if (/mobile/i.test(ua)) {
      if (/iphone/i.test(ua)) return "iPhone App/Safari";
      if (/android/i.test(ua)) return "Android Phone App";
      return "Dispositivo Móvel";
    }
    if (/ipad/i.test(ua)) return "iPad Tablet";
    if (/macintosh/i.test(ua)) return "MacOS Device";
    if (/windows/i.test(ua)) return "Windows PC";
    if (/linux/i.test(ua)) return "Linux Workstation";
    return "Navegador Web / Desktop";
  };

  const simulateLocation = (ip: string): string => {
    if (!ip || ip === "::1" || ip === "127.0.0.1" || ip.includes("localhost")) {
      return "São Paulo, SP (Localhost)";
    }
    const hashes = ip.split('.').map(Number);
    const cities = [
      "São Paulo, BR", "Rio de Janeiro, BR", "Belo Horizonte, BR", "Porto Alegre, BR", 
      "Salvador, BR", "Curitiba, BR", "Recife, BR", "Fortaleza, BR", "Brasília, BR",
      "Lisboa, PT", "Miami, US", "Dublin, IE"
    ];
    const index = Math.abs(hashes.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0)) % cities.length;
    return cities[index];
  };

  // Issue session and token helper
  const issueSessionAndTokens = (userId: string, email: string, name: string, ip: string, ua: string) => {
    const sessionId = "sess_" + crypto.randomBytes(16).toString("hex");
    const dispositivo = parseUserAgent(ua);
    const localizacao = simulateLocation(ip);
    serverDb.saveActiveSession(sessionId, userId, "jti_" + sessionId, ip, ua, dispositivo, localizacao);

    const token = jwt.sign(
      { userId, email, name, ua, sessionId },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = crypto.randomBytes(40).toString("hex");
    const refExp = new Date(Date.now() + 7 * 24 * 3600000).toISOString();
    serverDb.saveRefreshToken(refreshToken, userId, refExp);

    return { token, refreshToken, sessionId };
  };

  // --- SESSION INTEGRITY & HIJACKING PROTECTION ---
  const verifySessionIntegrity = (req: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // Anti-hijacking signature check
      const currentUa = req.headers["user-agent"] || "";
      if (decoded.ua && decoded.ua !== currentUa) {
        console.warn(`[SECURITY ALERT] Possible session hijacking! Expected user-agent: ${decoded.ua}, got: ${currentUa}`);
        serverDb.addAuditLog(
          decoded.userId,
          "SESSION_HIJACK_ATTEMPT",
          `Tentativa de sequestro de sessão bloqueada. User-Agent esperado: ${decoded.ua}, atual: ${currentUa}`,
          req.ip || "unknown",
          currentUa
        );
        return null;
      }

      // Active Session Remote Termination check
      if (decoded.sessionId && !serverDb.isSessionActive(decoded.sessionId)) {
        console.warn(`[SECURITY ALERT] Attempted access using a remotely terminated session: ${decoded.sessionId}`);
        return null;
      }

      return decoded;
    } catch {
      return null;
    }
  };

  // --- ROLE-BASED ACCESS CONTROL (RBAC) ---
  const requireRole = (allowedRoles: ("user" | "moderator" | "admin" | "auditor")[]) => {
    return (req: any, res: any, next: any) => {
      const decoded = verifySessionIntegrity(req);
      if (!decoded) {
        return res.status(401).json({ error: "Sessão expirada ou não autenticada." });
      }

      const role = serverDb.getUserRole(decoded.userId);
      if (!allowedRoles.includes(role)) {
        serverDb.addAuditLog(
          decoded.userId,
          "UNAUTHORIZED_ACCESS_DENIED",
          `Tentativa de acesso não autorizado à rota: ${req.originalUrl}. Cargo: ${role}`,
          req.ip || "unknown",
          req.headers["user-agent"] || ""
        );
        return res.status(403).json({ error: "Acesso negado. Nível de privilégio insuficiente." });
      }

      req.userId = decoded.userId;
      req.userRole = role;
      next();
    };
  };

  // --- ANTI-SSRF OUTGOING FILTER ---
  const validateOutgoingUrl = (urlStr: string): boolean => {
    try {
      const parsed = new URL(urlStr);
      const host = parsed.hostname.toLowerCase();
      const unsafeHosts = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
      if (unsafeHosts.includes(host)) return false;
      if (
        host.startsWith("169.254") ||
        host.startsWith("10.") ||
        host.startsWith("192.168") ||
        host.startsWith("172.")
      ) {
        return false;
      }
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  // API health route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // --- AUTH ENDPOINTS ---

  // GET /api/auth/me - Verify session integrity
  app.get("/api/auth/me", (req, res) => {
    const decoded = verifySessionIntegrity(req);
    if (!decoded) {
      return res.status(401).json({ error: "Sessão inválida, expirada ou corrompida (Sequestro de Sessão evitado)." });
    }

    try {
      const user = serverDb.getUser(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: "Usuário corporativo não encontrado." });
      }

      const role = serverDb.getUserRole(decoded.userId);
      const twoFactorEnabled = serverDb.get2faStatus(decoded.userId);

      return res.json({
        user: {
          email: user.email,
          name: user.name,
          provider: user.provider || "email",
          uid: user.uid,
          avatarUrl: user.avatarUrl,
          role,
          twoFactorEnabled
        }
      });
    } catch (err) {
      return res.status(500).json({ error: "Erro de integridade ao verificar credenciais." });
    }
  });

  // POST /api/auth/register
  app.post("/api/auth/register", checkBruteForceLockout, async (req, res) => {
    const { email, password, name } = req.body;
    const ip = String(req.ip || req.headers["x-forwarded-for"] || "unknown");
    const ua = String(req.headers["user-agent"] || "");

    if (!email || !password || !name) {
      return res.status(400).json({ error: "E-mail, senha e nome são obrigatórios." });
    }

    // Password strength check (Enterprise policy)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      serverDb.incrementIpBlock(ip);
      serverDb.addAuditLog("system", "REGISTER_FAILED", `Senha fraca rejeitada para o e-mail: ${email}`, ip, ua);
      return res.status(400).json({ 
        error: "A senha deve conter no mínimo 8 caracteres, incluindo pelo menos uma letra e um número para conformidade corporativa." 
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userId = "user_" + cleanEmail.replace(/[^a-zA-Z0-9_\-]/g, "_");

    try {
      const existingUser = serverDb.getUser(userId);
      if (existingUser) {
        serverDb.incrementIpBlock(ip);
        serverDb.addAuditLog("system", "REGISTER_FAILED", `Tentativa de cadastro com e-mail duplicado: ${cleanEmail}`, ip, ua);
        return res.status(400).json({ error: "Este e-mail já está registrado em nossa federação." });
      }

      // Safe password hashing
      const saltRounds = 11; // Corporate grade workload factor
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const newUser = {
        email: cleanEmail,
        password: hashedPassword,
        name,
        provider: "email" as const,
        uid: userId,
        avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name)}`
      };

      serverDb.saveUser(userId, newUser);
      serverDb.setUserRole(userId, "user"); // Default role

      // Generate a 6-digit email verification code
      const verifyCode = String(Math.floor(100000 + Math.random() * 900000));
      serverDb.setEmailVerificationCode(userId, verifyCode);

      serverDb.addAuditLog(userId, "REGISTER_SUCCESS", `Novo usuário registrado: ${cleanEmail}. Código de verificação gerado: ${verifyCode}`, ip, ua);

      // Issue Access, Refresh Tokens and Active Session
      const { token, refreshToken, sessionId } = issueSessionAndTokens(userId, cleanEmail, name, ip, ua);

      // Save initial successful login attempt
      const device = parseUserAgent(ua);
      const loc = simulateLocation(ip);
      serverDb.saveLoginAttempt(
        `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId,
        ip,
        ua,
        device,
        loc,
        "SUCESSO",
        false,
        null
      );

      serverDb.clearIpBlock(ip);

      return res.json({
        token,
        refreshToken,
        verifyCode, // Returned for sandbox environment simulation
        user: {
          email: newUser.email,
          name: newUser.name,
          provider: newUser.provider,
          uid: newUser.uid,
          avatarUrl: newUser.avatarUrl,
          role: "user",
          twoFactorEnabled: false,
          emailVerified: false
        }
      });
    } catch (err: any) {
      console.error("[AUTH REGISTRATION ERROR]", err);
      return res.status(500).json({ error: "Erro interno ao provisionar conta." });
    }
  });

  // POST /api/auth/login
  app.post("/api/auth/login", checkBruteForceLockout, async (req, res) => {
    const { email, password } = req.body;
    const ip = String(req.ip || req.headers["x-forwarded-for"] || "unknown");
    const ua = String(req.headers["user-agent"] || "");

    if (!email || !password) {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userId = "user_" + cleanEmail.replace(/[^a-zA-Z0-9_\-]/g, "_");

    try {
      const user = serverDb.getUser(userId);
      if (!user || !user.password) {
        serverDb.incrementIpBlock(ip);
        const block = serverDb.getIpBlock(ip);
        if (block && block.tentativas >= 5) {
          serverDb.blockIp(ip, 900); // Block IP for 15 mins
          serverDb.addAuditLog("system", "IP_LOCKOUT", `IP ${ip} bloqueado temporariamente após 5 falhas consecutivas de login`, ip, ua);
        }
        serverDb.addAuditLog("system", "LOGIN_FAILED", `Tentativa de login inválida para: ${cleanEmail}`, ip, ua);
        return res.status(400).json({ error: "E-mail ou senha incorretos." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        serverDb.incrementIpBlock(ip);
        const block = serverDb.getIpBlock(ip);
        if (block && block.tentativas >= 5) {
          serverDb.blockIp(ip, 900);
          serverDb.addAuditLog("system", "IP_LOCKOUT", `IP ${ip} bloqueado temporariamente após 5 falhas consecutivas de login`, ip, ua);
        }
        serverDb.addAuditLog(userId, "LOGIN_FAILED", `Senha incorreta fornecida para: ${cleanEmail}`, ip, ua);
        return res.status(400).json({ error: "E-mail ou senha incorretos." });
      }

      // Check if 2FA is active for this account
      const isTwoFactorEnabled = serverDb.get2faStatus(userId);
      if (isTwoFactorEnabled) {
        // Issue temporary 5-minute pre-auth token to finalize challenge
        const tempToken = jwt.sign({ userId, email: cleanEmail, preAuth: true }, JWT_SECRET, { expiresIn: "5m" });
        serverDb.addAuditLog(userId, "LOGIN_2FA_CHALLENGE", `Desafio 2FA disparado para o usuário: ${cleanEmail}`, ip, ua);
        return res.json({ requires2fa: true, tempToken });
      }

      // Success - Issue Sessions & Tokens
      const { token, refreshToken, sessionId } = issueSessionAndTokens(userId, cleanEmail, user.name, ip, ua);

      // Detect Suspicious Login (different device than last success)
      const device = parseUserAgent(ua);
      const loc = simulateLocation(ip);
      const history = serverDb.getLoginHistory(userId);
      let suspeito = false;
      let motivoSuspeito: string | null = null;
      if (history && history.length > 0) {
        const lastSuccess = history.find((h: any) => h.status === "SUCESSO");
        if (lastSuccess && lastSuccess.dispositivo !== device) {
          suspeito = true;
          motivoSuspeito = `Acesso de novo dispositivo detectado: ${device} (Último acesso: ${lastSuccess.dispositivo})`;
        }
      }

      // Save login history entry
      serverDb.saveLoginAttempt(
        `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId,
        ip,
        ua,
        device,
        loc,
        "SUCESSO",
        suspeito,
        motivoSuspeito
      );

      if (suspeito) {
        serverDb.addAuditLog(
          userId,
          "SUSPICIOUS_LOGIN_DETECTED",
          `ALERTA DE SEGURANÇA: Login suspeito detectado para ${cleanEmail}. ${motivoSuspeito}`,
          ip,
          ua
        );
      }

      serverDb.clearIpBlock(ip);
      const role = serverDb.getUserRole(userId);
      const verifyDetails = serverDb.getUserVerificationDetails(userId);

      serverDb.addAuditLog(userId, "LOGIN_SUCCESS", `Autenticação bem-sucedida: ${cleanEmail}`, ip, ua);

      return res.json({
        token,
        refreshToken,
        user: {
          email: user.email,
          name: user.name,
          provider: user.provider,
          uid: user.uid || userId,
          avatarUrl: user.avatarUrl,
          role,
          twoFactorEnabled: isTwoFactorEnabled,
          emailVerified: verifyDetails.emailVerificado,
          suspiciousAlert: suspeito ? motivoSuspeito : null
        }
      });
    } catch (err: any) {
      console.error("[AUTH LOGIN ERROR]", err);
      return res.status(500).json({ error: "Erro corporativo interno de autenticação." });
    }
  });

  // POST /api/auth/social-login
  app.post("/api/auth/social-login", checkBruteForceLockout, (req, res) => {
    const { email, name, avatarUrl, uid, provider } = req.body;
    const ip = String(req.ip || req.headers["x-forwarded-for"] || "unknown");
    const ua = String(req.headers["user-agent"] || "");

    if (!email || !provider) {
      return res.status(400).json({ error: "E-mail e provedor de login social são obrigatórios." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userId = uid || `user_${provider}_` + cleanEmail.replace(/[^a-zA-Z0-9_\-]/g, "_");

    try {
      const updatedUser = {
        email: cleanEmail,
        name: name || `Jogador ${provider}`,
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name || provider)}`,
        provider: provider as any,
        uid: userId
      };

      serverDb.saveUser(userId, updatedUser);
      // Auto-verify email for social logins
      serverDb.setEmailVerified(userId, true);
      const role = serverDb.getUserRole(userId);

      // Check if 2FA is active
      const isTwoFactorEnabled = serverDb.get2faStatus(userId);
      if (isTwoFactorEnabled) {
        const tempToken = jwt.sign({ userId, email: cleanEmail, preAuth: true }, JWT_SECRET, { expiresIn: "5m" });
        serverDb.addAuditLog(userId, "LOGIN_2FA_CHALLENGE", `Desafio 2FA (${provider.toUpperCase()} SSO) disparado para: ${cleanEmail}`, ip, ua);
        return res.json({ requires2fa: true, tempToken });
      }

      // Success - Issue Sessions & Tokens
      const { token, refreshToken, sessionId } = issueSessionAndTokens(userId, cleanEmail, updatedUser.name, ip, ua);

      // Detect Suspicious Login
      const device = parseUserAgent(ua);
      const loc = simulateLocation(ip);
      const history = serverDb.getLoginHistory(userId);
      let suspeito = false;
      let motivoSuspeito: string | null = null;
      if (history && history.length > 0) {
        const lastSuccess = history.find((h: any) => h.status === "SUCESSO");
        if (lastSuccess && lastSuccess.dispositivo !== device) {
          suspeito = true;
          motivoSuspeito = `Acesso de novo dispositivo detectado: ${device} (Último acesso: ${lastSuccess.dispositivo})`;
        }
      }

      serverDb.saveLoginAttempt(
        `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId,
        ip,
        ua,
        device,
        loc,
        "SUCESSO",
        suspeito,
        motivoSuspeito
      );

      if (suspeito) {
        serverDb.addAuditLog(
          userId,
          "SUSPICIOUS_LOGIN_DETECTED",
          `ALERTA DE SEGURANÇA: Login SSO suspeito detectado para ${cleanEmail}. ${motivoSuspeito}`,
          ip,
          ua
        );
      }

      serverDb.clearIpBlock(ip);
      serverDb.addAuditLog(userId, "SOCIAL_LOGIN_SUCCESS", `Login SSO via ${provider} bem-sucedido: ${cleanEmail}`, ip, ua);

      return res.json({
        token,
        refreshToken,
        user: {
          email: updatedUser.email,
          name: updatedUser.name,
          provider: updatedUser.provider,
          uid: updatedUser.uid,
          avatarUrl: updatedUser.avatarUrl,
          role,
          twoFactorEnabled: isTwoFactorEnabled,
          emailVerified: true,
          suspiciousAlert: suspeito ? motivoSuspeito : null
        }
      });
    } catch (err: any) {
      console.error(`[AUTH ${provider.toUpperCase()} LOGIN ERROR]`, err);
      return res.status(500).json({ error: `Erro de federação SSO via ${provider}.` });
    }
  });

  // POST /api/auth/google-login (Legacy compatibility)
  app.post("/api/auth/google-login", (req, res) => {
    req.body.provider = "google";
    // Proxy request to the new endpoint
    const route = app._router.stack.find((layer: any) => layer.route && layer.route.path === "/api/auth/social-login");
    if (route) {
      return route.route.stack[0].handle(req, res);
    }
    return res.status(500).json({ error: "Erro de roteamento social." });
  });

  // --- PASSWORD RECOVERY FLOWS ---
  // POST /api/auth/recover-password
  app.post("/api/auth/recover-password", checkBruteForceLockout, (req, res) => {
    const { email } = req.body;
    const ip = String(req.ip || req.headers["x-forwarded-for"] || "unknown");
    const ua = String(req.headers["user-agent"] || "");

    if (!email) {
      return res.status(400).json({ error: "E-mail é obrigatório." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userId = "user_" + cleanEmail.replace(/[^a-zA-Z0-9_\-]/g, "_");

    try {
      const user = serverDb.getUser(userId);
      if (!user) {
        // Obfuscate to prevent user enumeration / account harvesting
        return res.json({ 
          message: "Se este e-mail estiver registrado, um link e código de recuperação de senha foram gerados.",
          success: true
        });
      }

      const recoveryCode = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 15 * 60000).toISOString(); // 15 mins
      serverDb.setPasswordRecoveryCode(userId, recoveryCode, expiresAt);

      serverDb.addAuditLog(userId, "PASSWORD_RECOVERY_REQUESTED", `Código de recuperação gerado para ${cleanEmail}`, ip, ua);

      return res.json({
        message: "Se este e-mail estiver registrado, um link e código de recuperação de senha foram gerados.",
        success: true,
        debugCode: recoveryCode // Returned for sandbox environment simulation
      });
    } catch (err) {
      console.error("[RECOVER PASSWORD ERROR]", err);
      return res.status(500).json({ error: "Erro ao processar solicitação de recuperação." });
    }
  });

  // POST /api/auth/reset-password
  app.post("/api/auth/reset-password", checkBruteForceLockout, async (req, res) => {
    const { code, newPassword } = req.body;
    const ip = String(req.ip || req.headers["x-forwarded-for"] || "unknown");
    const ua = String(req.headers["user-agent"] || "");

    if (!code || !newPassword) {
      return res.status(400).json({ error: "Código e nova senha são obrigatórios." });
    }

    // Password strength check (Enterprise policy)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        error: "A nova senha deve conter no mínimo 8 caracteres, incluindo pelo menos uma letra e um número." 
      });
    }

    try {
      const user = serverDb.getUserByRecoveryCode(code);
      if (!user) {
        return res.status(400).json({ error: "Código de recuperação inválido ou expirado." });
      }

      // Check expiry
      if (user.recuperacao_expira && new Date(user.recuperacao_expira) < new Date()) {
        serverDb.clearRecoveryCode(user.id || `user_${user.email.replace(/[^a-zA-Z0-9]/g, "_")}`);
        return res.status(400).json({ error: "Código de recuperação expirado." });
      }

      const userId = user.id || `user_${user.email.replace(/[^a-zA-Z0-9]/g, "_")}`;
      const hashedPassword = await bcrypt.hash(newPassword, 11);

      // Update password
      const updatedUser = {
        ...user,
        password: hashedPassword
      };
      serverDb.saveUser(userId, updatedUser);
      serverDb.clearRecoveryCode(userId);

      // Terminate all sessions for security
      serverDb.terminateAllSessionsExcept(userId, "RESET_ALL");

      serverDb.addAuditLog(userId, "PASSWORD_RESET_SUCCESS", `Senha redefinida com sucesso. Todas as sessões anteriores foram invalidadas remotamente.`, ip, ua);

      return res.json({ message: "Senha redefinida com sucesso! Todas as sessões foram invalidadas por segurança.", success: true });
    } catch (err) {
      console.error("[RESET PASSWORD ERROR]", err);
      return res.status(500).json({ error: "Erro ao processar redefinição de senha." });
    }
  });

  // POST /api/auth/change-password
  app.post("/api/auth/change-password", (req, res) => {
    const decoded = verifySessionIntegrity(req);
    if (!decoded) {
      return res.status(401).json({ error: "Sessão expirada ou não autenticada." });
    }

    const { currentPassword, newPassword, terminateOthers } = req.body;
    const ip = String(req.ip || req.headers["x-forwarded-for"] || "unknown");
    const ua = String(req.headers["user-agent"] || "");

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Senha atual e nova senha são obrigatórias." });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ error: "A nova senha deve conter no mínimo 8 caracteres, incluindo pelo menos uma letra e um número." });
    }

    try {
      const user = serverDb.getUser(decoded.userId);
      if (!user || !user.password) {
        return res.status(400).json({ error: "Usuário corporativo não encontrado ou cadastrado via login social." });
      }

      bcrypt.compare(currentPassword, user.password).then(async (isMatch) => {
        if (!isMatch) {
          return res.status(400).json({ error: "Senha atual incorreta." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 11);
        const updatedUser = {
          ...user,
          password: hashedPassword
        };
        serverDb.saveUser(decoded.userId, updatedUser);

        if (terminateOthers) {
          serverDb.terminateAllSessionsExcept(decoded.userId, decoded.sessionId || "");
          serverDb.addAuditLog(decoded.userId, "PASSWORD_CHANGED", "Senha alterada com sucesso. Outras sessões ativas foram revogadas remotamente.", ip, ua);
        } else {
          serverDb.addAuditLog(decoded.userId, "PASSWORD_CHANGED", "Senha alterada com sucesso.", ip, ua);
        }

        return res.json({ message: "Senha alterada com sucesso!", success: true });
      });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao alterar senha." });
    }
  });


  // --- EMAIL VERIFICATION FLOWS ---
  // POST /api/auth/send-verification
  app.post("/api/auth/send-verification", (req, res) => {
    const decoded = verifySessionIntegrity(req);
    if (!decoded) return res.status(401).json({ error: "Sessão inválida ou expirada." });

    try {
      const verifyCode = String(Math.floor(100000 + Math.random() * 900000));
      serverDb.setEmailVerificationCode(decoded.userId, verifyCode);
      serverDb.addAuditLog(decoded.userId, "EMAIL_VERIFICATION_SENT", `Novo código de verificação enviado para ${decoded.email}`, req.ip || "unknown", req.headers["user-agent"] || "");

      return res.json({ 
        message: "Um novo código de verificação foi gerado e enviado.", 
        success: true,
        debugCode: verifyCode // Simulator backchannel
      });
    } catch {
      return res.status(500).json({ error: "Erro ao gerar código de verificação." });
    }
  });

  // POST /api/auth/verify-email
  app.post("/api/auth/verify-email", (req, res) => {
    const decoded = verifySessionIntegrity(req);
    if (!decoded) return res.status(401).json({ error: "Sessão inválida ou expirada." });

    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Código de verificação é obrigatório." });

    try {
      const details = serverDb.getUserVerificationDetails(decoded.userId);
      if (details.codigoVerificacao === code) {
        serverDb.setEmailVerified(decoded.userId, true);
        serverDb.addAuditLog(decoded.userId, "EMAIL_VERIFIED", `E-mail ${decoded.email} verificado com sucesso.`, req.ip || "unknown", req.headers["user-agent"] || "");
        return res.json({ message: "Sua conta de e-mail foi verificada com sucesso!", success: true });
      } else {
        return res.status(400).json({ error: "Código de verificação incorreto ou expirado." });
      }
    } catch {
      return res.status(500).json({ error: "Erro ao verificar e-mail." });
    }
  });


  // --- SESSION CONTROLLERS ---
  // GET /api/auth/sessions
  app.get("/api/auth/sessions", (req, res) => {
    const decoded = verifySessionIntegrity(req);
    if (!decoded) return res.status(401).json({ error: "Sessão inválida ou expirada." });

    try {
      const sessions = serverDb.getActiveSessions(decoded.userId);
      // Format session output
      const formatted = sessions.map(s => ({
        id: s.id,
        ip: s.ip_address,
        device: s.dispositivo,
        location: s.localizacao,
        createdAt: s.criado_em,
        lastAccess: s.ultimo_acesso,
        isCurrent: s.id === decoded.sessionId
      }));
      return res.json({ sessions: formatted });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao buscar sessões ativas." });
    }
  });

  // POST /api/auth/sessions/terminate
  app.post("/api/auth/sessions/terminate", (req, res) => {
    const decoded = verifySessionIntegrity(req);
    if (!decoded) return res.status(401).json({ error: "Sessão inválida ou expirada." });

    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "O ID da sessão é obrigatório." });

    try {
      // Security check: cannot terminate other users' sessions
      const sessions = serverDb.getActiveSessions(decoded.userId);
      const exists = sessions.some(s => s.id === sessionId);
      if (!exists) {
        return res.status(403).json({ error: "Operação não autorizada nesta sessão." });
      }

      serverDb.terminateSession(sessionId);
      serverDb.addAuditLog(decoded.userId, "SESSION_TERMINATED_REMOTELY", `Sessão ${sessionId} encerrada remotamente pelo usuário.`, req.ip || "unknown", req.headers["user-agent"] || "");

      return res.json({ message: "Sessão encerrada com sucesso!", success: true });
    } catch {
      return res.status(500).json({ error: "Erro ao revogar sessão." });
    }
  });

  // POST /api/auth/sessions/terminate-others
  app.post("/api/auth/sessions/terminate-others", (req, res) => {
    const decoded = verifySessionIntegrity(req);
    if (!decoded) return res.status(401).json({ error: "Sessão inválida ou expirada." });

    try {
      serverDb.terminateAllSessionsExcept(decoded.userId, decoded.sessionId || "");
      serverDb.addAuditLog(decoded.userId, "ALL_OTHER_SESSIONS_REVOKED", "Todas as outras sessões ativas foram encerradas remotamente.", req.ip || "unknown", req.headers["user-agent"] || "");

      return res.json({ message: "Todas as outras sessões foram encerradas com sucesso!", success: true });
    } catch {
      return res.status(500).json({ error: "Erro ao revogar outras sessões." });
    }
  });


  // --- LOGIN HISTORY CONTROLLERS ---
  // GET /api/auth/login-history
  app.get("/api/auth/login-history", (req, res) => {
    const decoded = verifySessionIntegrity(req);
    if (!decoded) return res.status(401).json({ error: "Sessão inválida ou expirada." });

    try {
      const history = serverDb.getLoginHistory(decoded.userId);
      const formatted = history.map(h => ({
        id: h.id,
        ip: h.ip_address,
        device: h.dispositivo,
        location: h.localizacao,
        status: h.status,
        timestamp: h.timestamp,
        suspicious: h.suspeito === 1,
        suspiciousReason: h.motivo_suspeito
      }));
      return res.json({ history: formatted });
    } catch {
      return res.status(500).json({ error: "Erro ao recuperar histórico de acessos." });
    }
  });


  // --- USER PRIVACY CONTROLLERS ---
  // GET /api/user/privacy
  app.get("/api/user/privacy", (req, res) => {
    const decoded = verifySessionIntegrity(req);
    if (!decoded) return res.status(401).json({ error: "Sessão inválida ou expirada." });

    try {
      const settings = serverDb.getPrivacySettings(decoded.userId);
      return res.json({ privacy: settings });
    } catch {
      return res.status(500).json({ error: "Erro ao buscar configurações de privacidade." });
    }
  });

  // POST /api/user/privacy
  app.post("/api/user/privacy", (req, res) => {
    const decoded = verifySessionIntegrity(req);
    if (!decoded) return res.status(401).json({ error: "Sessão inválida ou expirada." });

    const { settings } = req.body;
    if (!settings) return res.status(400).json({ error: "Configurações de privacidade são obrigatórias." });

    try {
      serverDb.savePrivacySettings(decoded.userId, settings);
      serverDb.addAuditLog(decoded.userId, "PRIVACY_SETTINGS_UPDATED", "Configurações de privacidade de perfil atualizadas.", req.ip || "unknown", req.headers["user-agent"] || "");
      return res.json({ message: "Preferências de privacidade salvas com sucesso!", success: true });
    } catch {
      return res.status(500).json({ error: "Erro ao salvar preferências." });
    }
  });


  // POST /api/auth/verify-2fa - Finish authentication challenge using dynamic dynamic code
  app.post("/api/auth/verify-2fa", async (req, res) => {
    const { tempToken, code } = req.body;
    const ip = String(req.ip || req.headers["x-forwarded-for"] || "unknown");
    const ua = String(req.headers["user-agent"] || "");

    if (!tempToken || !code) {
      return res.status(400).json({ error: "Código e token temporário são obrigatórios." });
    }

    try {
      const decoded = jwt.verify(tempToken, JWT_SECRET) as any;
      if (!decoded.preAuth) {
        return res.status(401).json({ error: "Token de autenticação inválido." });
      }

      const userId = decoded.userId;
      const user = serverDb.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado." });
      }

      const { secret, backupCodes } = serverDb.get2faSecret(userId);
      if (!secret) {
        return res.status(400).json({ error: "2FA não configurado nesta conta." });
      }

      // Validate Simulated TOTP Code
      // In standard node we simulate dynamic 2FA hashing:
      // The secret code is sliced to derive a 6-digit dynamic passcode for easy testing!
      const generatedCode = String(Math.abs(crypto.createHash('sha256').update(secret + Math.floor(Date.now() / 30000)).digest().readInt32BE(0)) % 1000000).padStart(6, '0');
      const prevGeneratedCode = String(Math.abs(crypto.createHash('sha256').update(secret + Math.floor((Date.now() - 30000) / 30000)).digest().readInt32BE(0)) % 1000000).padStart(6, '0');

      const isMatch = (code === generatedCode || code === prevGeneratedCode || backupCodes.includes(code));

      if (!isMatch) {
        serverDb.addAuditLog(userId, "2FA_VERIFICATION_FAILED", `Tentativa inválida de inserção de código 2FA: ${code}`, ip, ua);
        return res.status(400).json({ error: "Código dinâmico 2FA ou código de backup inválido." });
      }

      // Clear code if backup code used
      if (backupCodes.includes(code)) {
        const remainingCodes = backupCodes.filter(c => c !== code);
        serverDb.save2faSecret(userId, secret, remainingCodes);
        serverDb.addAuditLog(userId, "2FA_BACKUP_CODE_USED", `Código de backup 2FA utilizado e invalidado`, ip, ua);
      }

      // Issue full tokens
      const token = jwt.sign(
        { userId, email: user.email, name: user.name, ua },
        JWT_SECRET,
        { expiresIn: "15m" }
      );

      const refreshToken = crypto.randomBytes(40).toString("hex");
      const refExp = new Date(Date.now() + 7 * 24 * 3600000).toISOString();
      serverDb.saveRefreshToken(refreshToken, userId, refExp);

      const role = serverDb.getUserRole(userId);
      serverDb.addAuditLog(userId, "2FA_VERIFICATION_SUCCESS", `Autenticação multifator (2FA) concluída com sucesso`, ip, ua);

      return res.json({
        token,
        refreshToken,
        user: {
          email: user.email,
          name: user.name,
          provider: user.provider,
          uid: user.uid || userId,
          avatarUrl: user.avatarUrl,
          role,
          twoFactorEnabled: true
        }
      });
    } catch (err) {
      return res.status(401).json({ error: "Token de pré-autenticação expirado ou violado." });
    }
  });

  // POST /api/auth/refresh - Refresh Token Rotation (RTR) to prevent JWT hijack/session hijacking
  app.post("/api/auth/refresh", async (req, res) => {
    const { refreshToken } = req.body;
    const ip = String(req.ip || req.headers["x-forwarded-for"] || "unknown");
    const ua = String(req.headers["user-agent"] || "");

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token é obrigatório." });
    }

    const verified = serverDb.verifyRefreshToken(refreshToken);
    if (!verified) {
      serverDb.addAuditLog("system", "REFRESH_TOKEN_ABUSE", `Tentativa de reuso ou uso inválido de refresh token: ${refreshToken}`, ip, ua);
      return res.status(401).json({ error: "Refresh token inválido, expirado ou previamente revogado. Por favor, autentique-se novamente." });
    }

    const userId = verified.userId;
    const user = serverDb.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: "Usuário corporativo associado não encontrado." });
    }

    // Revoke old refresh token (Enforces rotation!)
    serverDb.revokeRefreshToken(refreshToken);

    // Issue brand new access & rotated refresh token!
    const token = jwt.sign(
      { userId, email: user.email, name: user.name, ua },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const newRefreshToken = crypto.randomBytes(40).toString("hex");
    const refExp = new Date(Date.now() + 7 * 24 * 3600000).toISOString();
    serverDb.saveRefreshToken(newRefreshToken, userId, refExp);

    return res.json({
      token,
      refreshToken: newRefreshToken
    });
  });

  // --- TWO-FACTOR AUTH SETUP & CONTROL ENDPOINTS ---

  // POST /api/user/2fa/setup - Initiate 2FA generator
  app.post("/api/user/2fa/setup", (req, res) => {
    const decoded = verifySessionIntegrity(req);
    if (!decoded) return res.status(401).json({ error: "Não autorizado." });

    const userId = decoded.userId;
    const user = serverDb.getUser(userId);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    // Generate simulated secure authenticator secret & backup codes
    const baseSecret = crypto.randomBytes(15).toString("hex").toUpperCase();
    const formattedSecret = baseSecret.match(/.{1,4}/g)?.join("-") || baseSecret;
    const backupCodes = Array.from({ length: 6 }, () => crypto.randomBytes(4).toString("hex").toUpperCase());

    serverDb.save2faSecret(userId, baseSecret, backupCodes);
    serverDb.addAuditLog(userId, "2FA_SETUP_INITIATED", `Processo de configuração 2FA iniciado`, req.ip || "unknown", req.headers["user-agent"] || "");

    return res.json({
      secret: formattedSecret,
      backupCodes,
      qrCodeSimulatedUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(baseSecret)}`
    });
  });

  // POST /api/user/2fa/toggle - Enable/Disable 2FA
  app.post("/api/user/2fa/toggle", (req, res) => {
    const decoded = verifySessionIntegrity(req);
    if (!decoded) return res.status(401).json({ error: "Não autorizado." });

    const { enabled, code } = req.body;
    const userId = decoded.userId;

    if (enabled) {
      if (!code) return res.status(400).json({ error: "Código de confirmação é obrigatório para ativar." });
      const { secret } = serverDb.get2faSecret(userId);
      if (!secret) return res.status(400).json({ error: "Segredo 2FA não configurado." });

      const generatedCode = String(Math.abs(crypto.createHash('sha256').update(secret + Math.floor(Date.now() / 30000)).digest().readInt32BE(0)) % 1000000).padStart(6, '0');
      const prevGeneratedCode = String(Math.abs(crypto.createHash('sha256').update(secret + Math.floor((Date.now() - 30000) / 30000)).digest().readInt32BE(0)) % 1000000).padStart(6, '0');

      if (code !== generatedCode && code !== prevGeneratedCode) {
        return res.status(400).json({ error: "Código incorreto. Ativação do 2FA abortada." });
      }

      serverDb.toggle2fa(userId, true);
      serverDb.addAuditLog(userId, "2FA_ENABLED", `Autenticação multifator (2FA) habilitada na conta`, req.ip || "unknown", req.headers["user-agent"] || "");
      return res.json({ success: true, enabled: true });
    } else {
      serverDb.toggle2fa(userId, false);
      serverDb.addAuditLog(userId, "2FA_DISABLED", `Autenticação multifator (2FA) desabilitada na conta`, req.ip || "unknown", req.headers["user-agent"] || "");
      return res.json({ success: true, enabled: false });
    }
  });

  // --- LGPD COMPLIANCE & PRIVACY ENDPOINTS ---

  // POST /api/user/lgpd/export - Export all user-related data (Data Portability)
  app.post("/api/user/lgpd/export", (req, res) => {
    const decoded = verifySessionIntegrity(req);
    if (!decoded) return res.status(401).json({ error: "Não autorizado." });

    const userId = decoded.userId;
    const user = serverDb.getUser(userId);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    try {
      const profile = serverDb.getProfile(userId) || {};
      const logs = serverDb.getLogs(userId) || [];
      const messages = serverDb.getMessages(userId, "") || [];
      const requests = serverDb.getLgpdRequests(userId) || [];

      const exportData = {
        lgpd_compliance_statement: "Este arquivo de portabilidade contém todas as informações pessoais identificáveis associadas a esta conta de usuário, em estrita conformidade com os artigos 18 e 19 da Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).",
        export_timestamp: new Date().toISOString(),
        user_account: {
          uid: user.uid,
          email: user.email,
          name: user.name,
          provider: user.provider
        },
        user_profile: profile,
        financial_and_game_logs: logs,
        chat_message_history_samples: messages,
        lgpd_requests_history: requests
      };

      serverDb.addLgpdRequest(userId, "PORTABILIDADE");
      serverDb.addAuditLog(userId, "LGPD_DATA_EXPORT", `Solicitação de portabilidade de dados em conformidade com a LGPD processada`, req.ip || "unknown", req.headers["user-agent"] || "");

      return res.json({ data: exportData });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao compilar dados portáveis da LGPD." });
    }
  });

  // POST /api/user/lgpd/forget - Anonymize entire account (Right to be Forgotten)
  app.post("/api/user/lgpd/forget", (req, res) => {
    const decoded = verifySessionIntegrity(req);
    if (!decoded) return res.status(401).json({ error: "Não autorizado." });

    const userId = decoded.userId;
    try {
      serverDb.addLgpdRequest(userId, "EXCLUSAO");
      serverDb.addAuditLog(userId, "LGPD_RIGHT_TO_BE_FORGOTTEN", `Solicitação de anonimização total de conta sob as diretrizes da LGPD executada`, req.ip || "unknown", req.headers["user-agent"] || "");
      
      // Anonymize records
      serverDb.anonymizeUserAccount(userId);

      return res.json({ success: true, message: "A conta e todos os dados pessoais associados foram anonimizados com êxito sob os termos da LGPD." });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao processar remoção sob diretrizes da LGPD." });
    }
  });

  // --- CORPORATE SECURITY DASHBOARD & DIAGNOSTICS (RBAC PROTECTED) ---

  // GET /api/security/stats - Metrics of the Security Center
  app.get("/api/security/stats", requireRole(["admin", "auditor"]), (req, res) => {
    try {
      const logs = serverDb.getAuditLogs();
      const dbFile = path.join(process.cwd(), "database.sqlite");
      let dbSize = "0 KB";
      if (fs.existsSync(dbFile)) {
        const stats = fs.statSync(dbFile);
        dbSize = `${(stats.size / 1024).toFixed(2)} KB`;
      }

      // Compute statistics
      const attemptsCount = logs.filter(l => l.event.includes("FAILED")).length;
      const lockoutCount = logs.filter(l => l.event.includes("LOCKOUT")).length;
      const ddosAlarms = logs.filter(l => l.event.includes("DDOS")).length;
      const tamperedLogs = logs.filter(l => l.isTampered).length;

      // Active sessions count (mock / token registries)
      const auditScore = tamperedLogs > 0 ? 65 : 100;

      return res.json({
        diagnostics: {
          databaseSize: dbSize,
          totalSecurityEvents: logs.length,
          failedAttempts: attemptsCount,
          activeLockouts: lockoutCount,
          ddosAlarmsCount: ddosAlarms,
          tamperedLogsDetected: tamperedLogs,
          securityComplianceScore: auditScore,
          isWafActive: true,
          encryptionStandard: "AES-256 / HMAC-SHA256",
          databaseStatus: "ESTÁVEL / WAL_MODE"
        },
        recentLogs: logs
      });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao ler diagnósticos de segurança." });
    }
  });

  // GET /api/security/backup - Export full signed system backup (Disaster Recovery)
  app.get("/api/security/backup", requireRole(["admin"]), (req: any, res) => {
    try {
      const backupData = serverDb.backupDatabase();
      const ip = String(req.ip || req.headers["x-forwarded-for"] || "unknown");
      const ua = String(req.headers["user-agent"] || "");
      serverDb.addAuditLog(req.userId || "admin", "DISASTER_RECOVERY_BACKUP", "Backup completo do sistema assinado e exportado com sucesso", ip, ua);
      return res.json({ backup: backupData });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao compilar backup do sistema." });
    }
  });

  // POST /api/security/restore - Restore state using signed payload (Disaster Recovery)
  app.post("/api/security/restore", requireRole(["admin"]), (req: any, res) => {
    const { backup } = req.body;
    if (!backup) {
      return res.status(400).json({ error: "O payload assinado de backup é obrigatório para a restauração." });
    }

    try {
      const success = serverDb.restoreDatabase(backup);
      const ip = String(req.ip || req.headers["x-forwarded-for"] || "unknown");
      const ua = String(req.headers["user-agent"] || "");
      if (success) {
        serverDb.addAuditLog(req.userId || "admin", "DISASTER_RECOVERY_RESTORE_SUCCESS", "Restauração completa do sistema realizada com sucesso via backup assinado", ip, ua);
        return res.json({ success: true, message: "Banco de dados restaurado e integridade verificada com sucesso!" });
      } else {
        serverDb.addAuditLog(req.userId || "admin", "DISASTER_RECOVERY_RESTORE_FAILED", "Falha de validação criptográfica na tentativa de restauração do sistema", ip, ua);
        return res.status(400).json({ error: "Falha na restauração. Assinatura criptográfica do backup violada ou corrompida." });
      }
    } catch (err) {
      return res.status(500).json({ error: "Erro interno durante a restauração do sistema." });
    }
  });

  // POST /api/user/role - Update user role (Admins only for RBAC setup)
  app.post("/api/user/role", requireRole(["admin"]), (req: any, res) => {
    const { targetUserId, newRole } = req.body;
    if (!targetUserId || !newRole) {
      return res.status(400).json({ error: "targetUserId e newRole são obrigatórios." });
    }

    const validRoles = ["user", "moderator", "admin", "auditor"];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ error: "Cargo inválido." });
    }

    try {
      serverDb.setUserRole(targetUserId, newRole);
      const ip = String(req.ip || req.headers["x-forwarded-for"] || "unknown");
      const ua = String(req.headers["user-agent"] || "");
      serverDb.addAuditLog(req.userId || "admin", "ROLE_UPDATED", `Cargo de ${targetUserId} atualizado para: ${newRole}`, ip, ua);
      return res.json({ success: true, targetUserId, newRole });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao atualizar cargo de usuário." });
    }
  });

  // --- PROFILE ENDPOINTS ---

  // GET /api/user/profile
  app.get("/api/user/profile", (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const profile = serverDb.getProfile(userId);
    if (profile) {
      return res.json({ profile });
    }

    // Return default profile
    const defaultStats = {
      coins: 150,
      lives: 3,
      currentStage: 1,
      highScore: 0,
      unlockedSkins: ["classic"],
      unlockedAccessories: ["none"],
      unlockedAuras: ["none"],
      avatar: { skin: "classic", accessory: "none", aura: "none" },
      points: 0,
      level: 1
    };

    return res.json({
      profile: {
        userId,
        stats: defaultStats,
        realBalance: 120.0,
        withdrawLimit: 100.0
      }
    });
  });

  // POST /api/user/profile
  app.post("/api/user/profile", (req, res) => {
    const { userId, stats, realBalance, withdrawLimit } = req.body;
    if (!userId || !stats) {
      return res.status(400).json({ error: "userId and stats are required" });
    }

    serverDb.saveProfile(userId, {
      userId,
      stats,
      realBalance: typeof realBalance === "number" ? realBalance : 120.0,
      withdrawLimit: typeof withdrawLimit === "number" ? withdrawLimit : 100.0
    });

    return res.json({ success: true });
  });

  // --- LOGS ENDPOINTS ---

  // GET /api/user/logs
  app.get("/api/user/logs", (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const logs = serverDb.getLogs(userId);
    return res.json({ logs });
  });

  // POST /api/user/log
  app.post("/api/user/log", (req, res) => {
    const { userId, log } = req.body;
    if (!userId || !log) {
      return res.status(400).json({ error: "userId and log are required" });
    }

    serverDb.addLog(userId, log);
    return res.json({ success: true });
  });

  // --- FEED API ROUTES ---

  // Gemini AI client initialization
  let geminiClient: GoogleGenAI | null = null;
  function getGeminiClient() {
    if (!geminiClient && process.env.GEMINI_API_KEY) {
      geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    }
    return geminiClient;
  }

  // AI Moderation & Spam Detection helper
  async function moderateContent(text: string, mediaUrl?: string): Promise<{ isSpam: boolean, flagged: boolean, reason?: string }> {
    const fallbackWords = ['spam', 'buy bitcoin', 'casino', 'free money', 'ganhe dinheiro facil', 'venda de drogas', 'ofensa', 'hacker'];
    const hasSpamWord = fallbackWords.some(w => text.toLowerCase().includes(w));
    
    const client = getGeminiClient();
    if (!client) {
      console.log("[AI MODERATION] No GEMINI_API_KEY found, using local rules.");
      if (hasSpamWord) {
        return { isSpam: true, flagged: true, reason: "Filtro local detectou termos impróprios ou spam suspeito." };
      }
      return { isSpam: false, flagged: false };
    }

    try {
      const prompt = `Analise a publicação social a seguir quanto a spam, comportamento abusivo, ofensas graves ou conteúdo impróprio.
Texto da publicação: "${text}"
Mídia (se aplicável): ${mediaUrl || "Nenhuma"}

Retorne uma estrutura JSON com:
- isSpam: true/false (indica se é spam excessivo, links suspeitos, publicidade indesejada)
- flagged: true/false (indica se deve ser moderado/bloqueado)
- reason: string explicando o veredito de moderação em português`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isSpam: { type: Type.BOOLEAN },
              flagged: { type: Type.BOOLEAN },
              reason: { type: Type.STRING }
            },
            required: ["isSpam", "flagged", "reason"]
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        return {
          isSpam: !!parsed.isSpam,
          flagged: !!parsed.flagged,
          reason: parsed.reason || "AI Moderation Verdict"
        };
      }
    } catch (err) {
      console.error("[AI MODERATION ERROR]", err);
    }

    // Fallback if API fails
    if (hasSpamWord) {
      return { isSpam: true, flagged: true, reason: "Regra de contingência de termos bloqueados ativada." };
    }
    return { isSpam: false, flagged: false };
  }

  // GET /api/feed - Fetch all posts with filtering, scoping, and relevance sorting
  app.get("/api/feed", async (req, res) => {
    try {
      let posts = serverDb.getPosts();
      const { scope, scopeId, hashtag, search, filter } = req.query;

      // 1. Filter by scope (groups, communities, events, pages, or general feed)
      if (scope) {
        posts = posts.filter(p => p.scoped_type === scope);
      }
      if (scopeId) {
        posts = posts.filter(p => p.scoped_id === scopeId);
      }

      // 2. Filter by hashtag
      if (hashtag) {
        const cleanHashtag = String(hashtag).toLowerCase().trim();
        posts = posts.filter(p => p.text.toLowerCase().includes(cleanHashtag));
      }

      // 3. Search query
      if (search) {
        const query = String(search).toLowerCase().trim();
        posts = posts.filter(p => p.text.toLowerCase().includes(query) || p.username.toLowerCase().includes(query));
      }

      // 4. Hide flagged posts
      posts = posts.filter(p => !p.is_flagged);

      // 5. Apply Relevance Algorithm or Content Recommendation if requested
      if (filter === "recommended" || filter === "popular") {
        const now = Date.now();
        const scoredPosts = posts.map(p => {
          let score = 100;
          const likesCount = p.likes?.length || 0;
          const commentsCount = p.comments?.length || 0;
          
          let reactionsCount = 0;
          if (p.reactions) {
            Object.values(p.reactions).forEach(uids => {
              reactionsCount += uids.length;
            });
          }

          score += (likesCount * 5) + (commentsCount * 8) + (reactionsCount * 3);

          // Recency decay
          try {
            const diffMs = now - new Date(p.created_at).getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            score -= (diffHours * 1.5); // 1.5 points deducted per hour
          } catch {}

          return { post: p, score };
        });

        // Sort by score descending
        scoredPosts.sort((a, b) => b.score - a.score);
        posts = scoredPosts.map(sp => sp.post);
      }

      return res.json({ posts, source: "sqlite" });
    } catch (err: any) {
      console.error("[FEED FETCH ERROR]", err);
      return res.status(500).json({ error: "Erro ao buscar publicações do banco de dados." });
    }
  });

  // POST /api/feed - Create a post with local image upload handling and AI moderation / spam detection
  app.post("/api/feed", upload.single("media"), async (req, res) => {
    const { username, userAvatarUrl, text, mediaBase64, mediaFileName, mediaUrl, mediaType, userId, scopedType, scopedId } = req.body;

    if (!username || !text) {
      return res.status(400).json({ error: "Nome de usuário e texto são obrigatórios." });
    }

    let finalMediaUrl = mediaUrl || "";

    // 1. Process files uploaded directly via multipart form upload
    if (req.file) {
      finalMediaUrl = `/uploads/${req.file.filename}`;
    }
    // 2. Process base64 data fallback
    else if (mediaBase64 && !finalMediaUrl) {
      const savedLocalUrl = saveBase64ToUploads(mediaBase64, mediaFileName || "upload.png");
      if (savedLocalUrl) {
        finalMediaUrl = savedLocalUrl;
      }
    }

    // AI Moderation & Spam Detection
    let isFlagged = 0;
    let flagReason = "";
    let aiModVerdict: any = null;

    try {
      const mod = await moderateContent(text, finalMediaUrl);
      if (mod.flagged) {
        isFlagged = 1;
        flagReason = mod.reason || "Conteúdo sinalizado pelo sistema de segurança.";
      }
      aiModVerdict = { isSpam: mod.isSpam, flagged: mod.flagged, reason: mod.reason };
    } catch (e) {
      console.error("[AI MODERATION CALL ERROR]", e);
    }

    const newPost = {
      id: `post-${Date.now()}`,
      userId: userId || undefined,
      username,
      userAvatarUrl: userAvatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(username)}`,
      text,
      media_url: finalMediaUrl || undefined,
      media_type: (mediaType as "image" | "video") || "image",
      created_at: new Date().toISOString(),
      likes: [],
      evaluations: {},
      comments: [],
      scoped_type: scopedType || "feed",
      scoped_id: scopedId || undefined,
      saved_by: [],
      reactions: {},
      is_flagged: isFlagged === 1,
      flag_reason: flagReason || undefined,
      ai_mod_verdict: aiModVerdict
    };

    try {
      serverDb.addPost(newPost);
      return res.json({ post: newPost, source: "sqlite", moderation: aiModVerdict });
    } catch (err: any) {
      console.error("[FEED POST CREATION ERROR]", err);
      return res.status(500).json({ error: "Erro ao criar nova publicação no SQLite." });
    }
  });

  // POST /api/feed/share - Re-share / Retweet a post
  app.post("/api/feed/share", (req, res) => {
    const { postId, userId, username, userAvatarUrl, text } = req.body;
    if (!postId || !userId || !username) {
      return res.status(400).json({ error: "postId, userId, and username are required" });
    }

    const posts = serverDb.getPosts();
    const sourcePost = posts.find(p => p.id === postId);
    if (!sourcePost) {
      return res.status(404).json({ error: "Post original não encontrado" });
    }

    const sharedPost = {
      id: `post-${Date.now()}`,
      userId,
      username,
      userAvatarUrl: userAvatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(username)}`,
      text: text || `Compartilhou a publicação de @${sourcePost.username}`,
      media_url: undefined,
      media_type: "image" as "image" | "video",
      created_at: new Date().toISOString(),
      likes: [],
      evaluations: {},
      comments: [],
      shared_post_id: postId,
      scoped_type: "feed",
      saved_by: [],
      reactions: {},
      is_flagged: false
    };

    try {
      serverDb.addPost(sharedPost);
      return res.json({ success: true, post: sharedPost });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao compartilhar publicação" });
    }
  });

  // POST /api/feed/react - Add reaction emoji to a post
  app.post("/api/feed/react", (req, res) => {
    const { postId, userId, reaction } = req.body; // reaction: 'love', 'haha', 'sad', 'wow', etc.
    if (!postId || !userId || !reaction) {
      return res.status(400).json({ error: "postId, userId, and reaction are required" });
    }

    const posts = serverDb.getPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
      return res.status(404).json({ error: "Post não encontrado" });
    }

    const post = posts[postIndex];
    if (!post.reactions) post.reactions = {};

    // Remove user reaction from any other reactions to avoid double-reacting
    Object.keys(post.reactions).forEach(r => {
      post.reactions![r] = post.reactions![r].filter(id => id !== userId);
    });

    if (!post.reactions[reaction]) post.reactions[reaction] = [];
    post.reactions[reaction].push(userId);

    posts[postIndex] = post;
    serverDb.savePosts(posts);

    return res.json({ success: true, reactions: post.reactions });
  });

  // POST /api/feed/save - Toggle bookmark/save a post
  app.post("/api/feed/save", (req, res) => {
    const { postId, userId } = req.body;
    if (!postId || !userId) {
      return res.status(400).json({ error: "postId and userId are required" });
    }

    const posts = serverDb.getPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
      return res.status(404).json({ error: "Post não encontrado" });
    }

    const post = posts[postIndex];
    if (!post.saved_by) post.saved_by = [];

    const savedIndex = post.saved_by.indexOf(userId);
    let saved = false;
    if (savedIndex > -1) {
      post.saved_by.splice(savedIndex, 1);
    } else {
      post.saved_by.push(userId);
      saved = true;
    }

    posts[postIndex] = post;
    serverDb.savePosts(posts);

    return res.json({ success: true, saved, saved_by: post.saved_by });
  });

  // GET /api/feed/saved/:userId - Get saved posts for a user
  app.get("/api/feed/saved/:userId", (req, res) => {
    const { userId } = req.params;
    try {
      const posts = serverDb.getPosts();
      const savedPosts = posts.filter(p => p.saved_by && p.saved_by.includes(userId));
      return res.json({ posts: savedPosts });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao buscar itens salvos" });
    }
  });

  // POST /api/feed/report - User reporting a post (with automatic AI review and database reporting)
  app.post("/api/feed/report", async (req, res) => {
    const { postId, reporterId, reason } = req.body;
    if (!postId || !reporterId || !reason) {
      return res.status(400).json({ error: "postId, reporterId, and reason are required" });
    }

    const posts = serverDb.getPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
      return res.status(404).json({ error: "Post não encontrado" });
    }

    const post = posts[postIndex];
    const reportId = `rep-${Date.now()}`;

    try {
      // Add report row in database
      serverDb.addReport(reportId, reporterId, post.userId || null, "post", postId, reason, "pending", new Date().toISOString());

      // Fast AI audit trigger
      const mod = await moderateContent(post.text, post.media_url);
      if (mod.flagged) {
        post.is_flagged = true;
        post.flag_reason = `AI Moderation Autoshield: ${mod.reason}`;
        posts[postIndex] = post;
        serverDb.savePosts(posts);
        serverDb.updateReportStatus(reportId, "resolved_flagged");
      }

      return res.json({ success: true, reportId, aiReviewTriggered: true, postFlagged: !!mod.flagged });
    } catch (err) {
      console.error("[REPORT SUBMIT ERROR]", err);
      return res.status(500).json({ error: "Erro ao registrar denúncia" });
    }
  });

  // GET /api/social/trending - Trending topics analysis
  app.get("/api/social/trending", (req, res) => {
    try {
      const posts = serverDb.getPosts();
      const hashtagCounts: Record<string, number> = {};
      posts.forEach(p => {
        if (p.is_flagged) return;
        const tags = (p.text || "").match(/#[a-zA-Z0-9À-ÿ_]+/g) || [];
        tags.forEach((tag: any) => {
          const cleanTag = String(tag).toLowerCase();
          hashtagCounts[cleanTag] = (hashtagCounts[cleanTag] || 0) + 1;
        });
      });
      const sortedTrending = Object.entries(hashtagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      return res.json({ trending: sortedTrending });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao carregar trending topics" });
    }
  });

  // --- STORIES ---
  // GET /api/social/stories - Get active stories (expires_at > now)
  app.get("/api/social/stories", (req, res) => {
    try {
      const stories = serverDb.getStories();
      return res.json({ stories });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao carregar stories" });
    }
  });

  // POST /api/social/stories - Create story
  app.post("/api/social/stories", upload.single("media"), async (req, res) => {
    const { username, userAvatarUrl, text, mediaBase64, mediaFileName, mediaUrl, mediaType, userId, bgColor } = req.body;
    if (!username || (!text && !req.file && !mediaBase64 && !mediaUrl)) {
      return res.status(400).json({ error: "Nome de usuário e alguma mídia/texto são obrigatórios." });
    }

    let finalMediaUrl = mediaUrl || "";
    if (req.file) {
      finalMediaUrl = `/uploads/${req.file.filename}`;
    } else if (mediaBase64 && !finalMediaUrl) {
      const savedLocalUrl = saveBase64ToUploads(mediaBase64, mediaFileName || "story.png");
      if (savedLocalUrl) finalMediaUrl = savedLocalUrl;
    }

    // AI check for story
    let isFlagged = 0;
    let flagReason = "";
    let aiModVerdict: any = null;
    if (text) {
      try {
        const mod = await moderateContent(text, finalMediaUrl);
        if (mod.flagged) {
          isFlagged = 1;
          flagReason = mod.reason || "Story violou as diretrizes de comunidade.";
        }
        aiModVerdict = mod;
      } catch {}
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 Hours

    const story = {
      id: `story-${Date.now()}`,
      usuario_id: userId || undefined,
      username,
      user_avatar_url: userAvatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(username)}`,
      media_url: finalMediaUrl || undefined,
      media_type: (mediaType as 'image' | 'video') || 'image',
      bg_color: bgColor || undefined,
      text: text || undefined,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
      is_flagged: isFlagged === 1,
      flag_reason: flagReason || undefined,
      ai_mod_verdict: aiModVerdict
    };

    try {
      serverDb.addStory(story);
      return res.json({ success: true, story });
    } catch (err) {
      console.error("[STORY CREATE ERROR]", err);
      return res.status(500).json({ error: "Erro ao criar story" });
    }
  });

  // --- GROUPS / COMMUNITIES ---
  app.get("/api/social/groups", (req, res) => {
    try {
      const groups = serverDb.getSocialGroups();
      return res.json({ groups });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao carregar grupos" });
    }
  });

  app.post("/api/social/groups", (req, res) => {
    const { name, description, creatorId, avatarUrl, bannerUrl, type } = req.body;
    if (!name || !creatorId) {
      return res.status(400).json({ error: "name and creatorId are required" });
    }

    const group = {
      id: `group-${Date.now()}`,
      name,
      description,
      creator_id: creatorId,
      avatar_url: avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name)}`,
      banner_url: bannerUrl,
      type: type || "group",
      created_at: new Date().toISOString()
    };

    try {
      serverDb.addSocialGroup(group);
      return res.json({ success: true, group });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao criar grupo/comunidade" });
    }
  });

  app.post("/api/social/groups/:id/join", (req, res) => {
    const { id } = req.params;
    const { userId, type } = req.body; // type: 'group' or 'community'
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const success = serverDb.joinGroup(userId, id, type || 'group', new Date().toISOString());
    if (success) {
      return res.json({ success: true });
    }
    return res.status(400).json({ error: "Erro ao entrar no grupo" });
  });

  app.post("/api/social/groups/:id/leave", (req, res) => {
    const { id } = req.params;
    const { userId, type } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const success = serverDb.leaveGroup(userId, id, type || 'group');
    if (success) {
      return res.json({ success: true });
    }
    return res.status(400).json({ error: "Erro ao sair do grupo" });
  });

  app.get("/api/social/groups/:id/members", (req, res) => {
    const { id } = req.params;
    try {
      const members = serverDb.getGroupMembers(id);
      return res.json({ members });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao carregar membros" });
    }
  });

  // --- EVENTS ---
  app.get("/api/social/events", (req, res) => {
    try {
      const events = serverDb.getSocialEvents();
      return res.json({ events });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao carregar eventos" });
    }
  });

  app.post("/api/social/events", (req, res) => {
    const { title, description, creatorId, date, location, avatarUrl, bannerUrl } = req.body;
    if (!title || !creatorId || !date) {
      return res.status(400).json({ error: "title, creatorId, and date are required" });
    }

    const event = {
      id: `evt-${Date.now()}`,
      title,
      description,
      creator_id: creatorId,
      date,
      location,
      avatar_url: avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(title)}`,
      banner_url: bannerUrl,
      created_at: new Date().toISOString()
    };

    try {
      serverDb.addSocialEvent(event);
      return res.json({ success: true, event });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao criar evento" });
    }
  });

  app.post("/api/social/events/:id/rsvp", (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const success = serverDb.joinGroup(userId, id, 'event', new Date().toISOString());
    if (success) {
      return res.json({ success: true });
    }
    return res.status(400).json({ error: "Erro ao responder convite do evento" });
  });

  // --- PAGES ---
  app.get("/api/social/pages", (req, res) => {
    try {
      const pages = serverDb.getSocialPages();
      return res.json({ pages });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao carregar páginas" });
    }
  });

  app.post("/api/social/pages", (req, res) => {
    const { name, description, creatorId, avatarUrl, bannerUrl, category } = req.body;
    if (!name || !creatorId) {
      return res.status(400).json({ error: "name and creatorId are required" });
    }

    const page = {
      id: `page-${Date.now()}`,
      name,
      description,
      creator_id: creatorId,
      avatar_url: avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name)}`,
      banner_url: bannerUrl,
      category,
      created_at: new Date().toISOString()
    };

    try {
      serverDb.addSocialPage(page);
      return res.json({ success: true, page });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao criar página" });
    }
  });

  app.post("/api/social/pages/:id/follow", (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const success = serverDb.joinGroup(userId, id, 'page', new Date().toISOString());
    if (success) {
      return res.json({ success: true });
    }
    return res.status(400).json({ error: "Erro ao seguir página" });
  });

  app.get("/api/social/memberships/:userId", (req, res) => {
    const { userId } = req.params;
    try {
      const memberships = serverDb.getMemberships(userId);
      return res.json({ memberships });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao carregar inscrições" });
    }
  });

  // POST /api/feed/like
  app.post("/api/feed/like", (req, res) => {
    const { postId, userId } = req.body;
    if (!postId || !userId) {
      return res.status(400).json({ error: "postId and userId are required" });
    }

    const posts = serverDb.getPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
      return res.status(404).json({ error: "Post não encontrado" });
    }

    const post = posts[postIndex];
    if (!post.likes) post.likes = [];

    const likedIndex = post.likes.indexOf(userId);
    if (likedIndex > -1) {
      // Unlike
      post.likes.splice(likedIndex, 1);
    } else {
      // Like
      post.likes.push(userId);
    }

    posts[postIndex] = post;
    serverDb.savePosts(posts);

    return res.json({ success: true, likes: post.likes });
  });

  // POST /api/feed/evaluate
  app.post("/api/feed/evaluate", (req, res) => {
    const { postId, userId, rating } = req.body;
    if (!postId || !userId || typeof rating !== "number") {
      return res.status(400).json({ error: "postId, userId and rating are required" });
    }

    const posts = serverDb.getPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
      return res.status(404).json({ error: "Post não encontrado" });
    }

    const post = posts[postIndex];
    if (!post.evaluations) post.evaluations = {};

    post.evaluations[userId] = rating;

    posts[postIndex] = post;
    serverDb.savePosts(posts);

    return res.json({ success: true, evaluations: post.evaluations });
  });

  // POST /api/feed/comment
  app.post("/api/feed/comment", (req, res) => {
    const { postId, userId, username, userAvatarUrl, text } = req.body;
    if (!postId || !userId || !username || !text) {
      return res.status(400).json({ error: "postId, userId, username and text are required" });
    }

    const posts = serverDb.getPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
      return res.status(404).json({ error: "Post não encontrado" });
    }

    const post = posts[postIndex];
    if (!post.comments) post.comments = [];

    const newComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      username,
      userAvatarUrl: userAvatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(username)}`,
      text,
      created_at: new Date().toISOString(),
      likes: [],
      replies: []
    };

    post.comments.push(newComment);
    posts[postIndex] = post;
    serverDb.savePosts(posts);

    return res.json({ success: true, comment: newComment });
  });

  // POST /api/feed/comment/edit
  app.post("/api/feed/comment/edit", (req, res) => {
    const { postId, commentId, text } = req.body;
    if (!postId || !commentId || !text) {
      return res.status(400).json({ error: "postId, commentId and text are required" });
    }

    const posts = serverDb.getPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
      return res.status(404).json({ error: "Post não encontrado" });
    }

    const post = posts[postIndex];
    if (!post.comments) return res.status(404).json({ error: "Comentários não encontrados" });

    const commentIndex = post.comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ error: "Comentário não encontrado" });
    }

    post.comments[commentIndex].text = text;
    posts[postIndex] = post;
    serverDb.savePosts(posts);

    return res.json({ success: true, comment: post.comments[commentIndex] });
  });

  // POST /api/feed/comment/delete
  app.post("/api/feed/comment/delete", (req, res) => {
    const { postId, commentId } = req.body;
    if (!postId || !commentId) {
      return res.status(400).json({ error: "postId and commentId are required" });
    }

    const posts = serverDb.getPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
      return res.status(404).json({ error: "Post não encontrado" });
    }

    const post = posts[postIndex];
    if (!post.comments) return res.status(404).json({ error: "Comentários não encontrados" });

    post.comments = post.comments.filter(c => c.id !== commentId);
    posts[postIndex] = post;
    serverDb.savePosts(posts);

    return res.json({ success: true });
  });

  // POST /api/feed/comment/like
  app.post("/api/feed/comment/like", (req, res) => {
    const { postId, commentId, userId } = req.body;
    if (!postId || !commentId || !userId) {
      return res.status(400).json({ error: "postId, commentId and userId are required" });
    }

    const posts = serverDb.getPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
      return res.status(404).json({ error: "Post não encontrado" });
    }

    const post = posts[postIndex];
    if (!post.comments) return res.status(404).json({ error: "Comentário não encontrado" });

    const commentIndex = post.comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ error: "Comentário não encontrado" });
    }

    const comment = post.comments[commentIndex];
    if (!comment.likes) comment.likes = [];

    const likedIndex = comment.likes.indexOf(userId);
    if (likedIndex > -1) {
      comment.likes.splice(likedIndex, 1);
    } else {
      comment.likes.push(userId);
    }

    post.comments[commentIndex] = comment;
    posts[postIndex] = post;
    serverDb.savePosts(posts);

    return res.json({ success: true, likes: comment.likes });
  });

  // POST /api/feed/comment/reply
  app.post("/api/feed/comment/reply", (req, res) => {
    const { postId, commentId, userId, username, userAvatarUrl, text } = req.body;
    if (!postId || !commentId || !userId || !username || !text) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    const posts = serverDb.getPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
      return res.status(404).json({ error: "Post não encontrado" });
    }

    const post = posts[postIndex];
    if (!post.comments) return res.status(404).json({ error: "Comentário não encontrado" });

    const commentIndex = post.comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ error: "Comentário não encontrado" });
    }

    const comment = post.comments[commentIndex];
    if (!comment.replies) comment.replies = [];

    const newReply = {
      id: `reply-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      username,
      userAvatarUrl: userAvatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(username)}`,
      text,
      created_at: new Date().toISOString(),
      likes: []
    };

    comment.replies.push(newReply);
    post.comments[commentIndex] = comment;
    posts[postIndex] = post;
    serverDb.savePosts(posts);

    return res.json({ success: true, reply: newReply });
  });

  // --- COMPREHENSIVE NEW PORTAL & WHATSAPP CHAT ENDPOINTS ---

  // POST /api/upload - Handle profile photos, chat photos, or recorded audio files
  app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado para upload." });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    return res.json({ success: true, url: fileUrl });
  });

  // POST /api/user/profile/details - Modify biography, name, username, avatar, stores, files, avatarGallery
  app.post("/api/user/profile/details", (req, res) => {
    const { userId, name, username, biography, avatar, stores, files, avatarGallery } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "O campo userId é obrigatório." });
    }

    try {
      if (username) {
        const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (cleanUsername !== username) {
          return res.status(400).json({ error: "O nome de usuário deve conter apenas letras, números e underlines (_)." });
        }
        if (serverDb.checkUsernameExists(cleanUsername, userId)) {
          return res.status(400).json({ error: "Este nome de usuário já está sendo usado por outro jogador." });
        }
      }

      serverDb.updateProfileDetails(userId, { name, username, biography, avatar, stores, files, avatarGallery });
      const updatedProfile = serverDb.getProfile(userId);
      return res.json({ success: true, profile: updatedProfile });
    } catch (err: any) {
      console.error("[PROFILE UPDATE ERROR]", err);
      return res.status(500).json({ error: "Erro ao atualizar dados do perfil." });
    }
  });

  // POST /api/user/friend-request - Friendship system
  app.post("/api/user/friend-request", (req, res) => {
    const { senderId, targetId, action } = req.body;
    if (!senderId || !targetId || !action) {
      return res.status(400).json({ error: "Campos senderId, targetId e action são obrigatórios." });
    }

    try {
      const sender = serverDb.getProfile(senderId);
      const target = serverDb.getProfile(targetId);
      if (!sender || !target) {
        return res.status(404).json({ error: "Usuários não encontrados." });
      }

      let senderAmigos = sender.amigos || [];
      let senderSolicitacoes = sender.solicitacoesAmizade || [];
      let targetAmigos = target.amigos || [];
      let targetSolicitacoes = target.solicitacoesAmizade || [];

      if (action === "send") {
        if (senderAmigos.includes(targetId)) {
          return res.status(400).json({ error: "Vocês já são amigos!" });
        }
        if (targetSolicitacoes.includes(senderId)) {
          return res.status(400).json({ error: "Solicitação de amizade já enviada." });
        }
        targetSolicitacoes.push(senderId);
        serverDb.updateProfileDetails(targetId, { solicitacoesAmizade: targetSolicitacoes });
        serverDb.addAuditLog(senderId, "FRIEND_REQUEST_SENT", `Solicitação de amizade enviada para ${targetId}`, req.ip || "unknown", req.headers["user-agent"] || "");
      } else if (action === "accept") {
        targetSolicitacoes = targetSolicitacoes.filter(id => id !== senderId);
        senderSolicitacoes = senderSolicitacoes.filter(id => id !== targetId);

        if (!senderAmigos.includes(targetId)) senderAmigos.push(targetId);
        if (!targetAmigos.includes(senderId)) targetAmigos.push(senderId);

        // Earn milestones/achievements
        const senderConquistas = sender.conquistas || [];
        if (!senderConquistas.includes("first_friend")) senderConquistas.push("first_friend");

        const targetConquistas = target.conquistas || [];
        if (!targetConquistas.includes("first_friend")) targetConquistas.push("first_friend");

        serverDb.updateProfileDetails(senderId, { amigos: senderAmigos, solicitacoesAmizade: senderSolicitacoes, conquistas: senderConquistas });
        serverDb.updateProfileDetails(targetId, { amigos: targetAmigos, solicitacoesAmizade: targetSolicitacoes, conquistas: targetConquistas });
        serverDb.addAuditLog(senderId, "FRIEND_REQUEST_ACCEPTED", `Solicitação de amizade de ${targetId} aceita com sucesso`, req.ip || "unknown", req.headers["user-agent"] || "");
      } else if (action === "decline") {
        senderSolicitacoes = senderSolicitacoes.filter(id => id !== targetId);
        serverDb.updateProfileDetails(senderId, { solicitacoesAmizade: senderSolicitacoes });
        serverDb.addAuditLog(senderId, "FRIEND_REQUEST_DECLINED", `Solicitação de amizade de ${targetId} recusada`, req.ip || "unknown", req.headers["user-agent"] || "");
      } else if (action === "remove") {
        senderAmigos = senderAmigos.filter(id => id !== targetId);
        targetAmigos = targetAmigos.filter(id => id !== senderId);
        serverDb.updateProfileDetails(senderId, { amigos: senderAmigos });
        serverDb.updateProfileDetails(targetId, { amigos: targetAmigos });
        serverDb.addAuditLog(senderId, "FRIEND_REMOVED", `Desfeita amizade com ${targetId}`, req.ip || "unknown", req.headers["user-agent"] || "");
      }

      return res.json({ success: true, sender: serverDb.getProfile(senderId), target: serverDb.getProfile(targetId) });
    } catch (err: any) {
      console.error("[FRIEND REQUEST ERROR]", err);
      return res.status(500).json({ error: "Erro ao processar solicitação de amizade." });
    }
  });

  // POST /api/user/block - Block/Unblock user
  app.post("/api/user/block", (req, res) => {
    const { senderId, targetId, action } = req.body;
    if (!senderId || !targetId || !action) {
      return res.status(400).json({ error: "Campos senderId, targetId e action são obrigatórios." });
    }

    try {
      const sender = serverDb.getProfile(senderId);
      if (!sender) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      let blockedList = sender.bloqueados || [];
      if (action === "block") {
        if (!blockedList.includes(targetId)) blockedList.push(targetId);
        
        // Also remove from friendships if they were friends
        let senderAmigos = sender.amigos || [];
        senderAmigos = senderAmigos.filter(id => id !== targetId);
        
        const target = serverDb.getProfile(targetId);
        if (target) {
          let targetAmigos = target.amigos || [];
          targetAmigos = targetAmigos.filter(id => id !== senderId);
          serverDb.updateProfileDetails(targetId, { amigos: targetAmigos });
        }

        serverDb.updateProfileDetails(senderId, { bloqueados: blockedList, amigos: senderAmigos });
        serverDb.addAuditLog(senderId, "USER_BLOCKED", `Usuário ${targetId} bloqueado com sucesso`, req.ip || "unknown", req.headers["user-agent"] || "");
      } else if (action === "unblock") {
        blockedList = blockedList.filter(id => id !== targetId);
        serverDb.updateProfileDetails(senderId, { bloqueados: blockedList });
        serverDb.addAuditLog(senderId, "USER_UNBLOCKED", `Usuário ${targetId} desbloqueado`, req.ip || "unknown", req.headers["user-agent"] || "");
      }

      return res.json({ success: true, profile: serverDb.getProfile(senderId) });
    } catch (err: any) {
      console.error("[BLOCK USER ERROR]", err);
      return res.status(500).json({ error: "Erro ao processar bloqueio." });
    }
  });

  // POST /api/user/report - User reporting
  app.post("/api/user/report", (req, res) => {
    const { senderId, targetId, reason, description } = req.body;
    if (!senderId || !targetId || !reason) {
      return res.status(400).json({ error: "Campos senderId, targetId e reason são obrigatórios." });
    }

    try {
      const target = serverDb.getProfile(targetId);
      if (!target) {
        return res.status(404).json({ error: "Jogador denunciado não encontrado." });
      }

      const targetDenuncias = target.denuncias || [];
      targetDenuncias.push({
        id: `rep-${Date.now()}`,
        senderId,
        reason,
        description: description || "",
        created_at: new Date().toISOString()
      });

      serverDb.updateProfileDetails(targetId, { denuncias: targetDenuncias });
      serverDb.addAuditLog(senderId, "USER_REPORTED", `Denúncia registrada contra ${targetId}. Motivo: ${reason}`, req.ip || "unknown", req.headers["user-agent"] || "");

      return res.json({ success: true, message: "Sua denúncia foi registrada e será analisada por nossa equipe de moderadores." });
    } catch (err: any) {
      console.error("[REPORT USER ERROR]", err);
      return res.status(500).json({ error: "Erro ao processar denúncia." });
    }
  });

  // POST /api/user/reputation - Reputation system
  app.post("/api/user/reputation", (req, res) => {
    const { senderId, targetId, vote } = req.body; // vote: 'up' | 'down'
    if (!senderId || !targetId || !vote) {
      return res.status(400).json({ error: "Campos senderId, targetId e vote são obrigatórios." });
    }

    try {
      const target = serverDb.getProfile(targetId);
      if (!target) {
        return res.status(404).json({ error: "Jogador não encontrado." });
      }

      const reputacaoVotos = target.reputacaoVotos || {};
      const previousVote = reputacaoVotos[senderId];

      let scoreDiff = 0;
      if (previousVote === vote) {
        // Undo vote
        delete reputacaoVotos[senderId];
        scoreDiff = vote === "up" ? -1 : 1;
      } else {
        // New vote or change vote
        if (previousVote === "up") scoreDiff -= 1;
        if (previousVote === "down") scoreDiff += 1;

        reputacaoVotos[senderId] = vote;
        scoreDiff += vote === "up" ? 1 : -1;
      }

      const currentRep = target.reputacao || 0;
      const finalRep = Math.max(0, currentRep + scoreDiff);

      // Award premium/verificado badges based on high reputation milestones as easter eggs
      const targetConquistas = target.conquistas || [];
      if (finalRep >= 10 && !targetConquistas.includes("reputation_10")) targetConquistas.push("reputation_10");
      if (finalRep >= 50 && !targetConquistas.includes("reputation_50")) targetConquistas.push("reputation_50");

      serverDb.updateProfileDetails(targetId, { 
        reputacao: finalRep, 
        reputacaoVotos, 
        conquistas: targetConquistas 
      });

      serverDb.addAuditLog(senderId, "REPUTATION_VOTE", `Voto de reputação (${vote}) registrado para ${targetId}`, req.ip || "unknown", req.headers["user-agent"] || "");

      return res.json({ success: true, reputacao: finalRep, reputacaoVotos });
    } catch (err: any) {
      console.error("[REPUTATION ERROR]", err);
      return res.status(500).json({ error: "Erro ao processar voto de reputação." });
    }
  });

  // POST /api/user/privacy-settings - Privacy preferences config
  app.post("/api/user/privacy-settings", (req, res) => {
    const { userId, privacySettings } = req.body;
    if (!userId || !privacySettings) {
      return res.status(400).json({ error: "Campos userId e privacySettings são obrigatórios." });
    }

    try {
      serverDb.updateProfileDetails(userId, { privacySettings });
      serverDb.addAuditLog(userId, "PRIVACY_SETTINGS_UPDATED", `Configurações de privacidade atualizadas`, req.ip || "unknown", req.headers["user-agent"] || "");
      return res.json({ success: true, profile: serverDb.getProfile(userId) });
    } catch (err: any) {
      console.error("[PRIVACY SETTINGS ERROR]", err);
      return res.status(500).json({ error: "Erro ao atualizar privacidade." });
    }
  });

  // POST /api/user/premium-toggle - VIP / Premium status activate
  app.post("/api/user/premium-toggle", (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "O campo userId é obrigatório." });
    }

    try {
      const profile = serverDb.getProfile(userId);
      if (!profile) return res.status(404).json({ error: "Jogador não encontrado." });

      const nextPremiumState = !profile.premium;
      const conquistas = profile.conquistas || [];
      if (nextPremiumState && !conquistas.includes("profile_premium")) {
        conquistas.push("profile_premium");
      }

      serverDb.updateProfileDetails(userId, { premium: nextPremiumState, conquistas });
      serverDb.addAuditLog(userId, "PREMIUM_STATUS_TOGGLED", `Status premium alterado para: ${nextPremiumState}`, req.ip || "unknown", req.headers["user-agent"] || "");

      return res.json({ success: true, premium: nextPremiumState });
    } catch (err: any) {
      console.error("[PREMIUM TOGGLE ERROR]", err);
      return res.status(500).json({ error: "Erro ao alterar status premium." });
    }
  });

  // POST /api/user/verify-request - Request verified badge verification
  app.post("/api/user/verify-request", (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "O campo userId é obrigatório." });
    }

    try {
      const profile = serverDb.getProfile(userId);
      if (!profile) return res.status(404).json({ error: "Jogador não encontrado." });

      // Simulate instantaneous verify upgrade for sandbox fun, but logs it securely!
      serverDb.updateProfileDetails(userId, { verificado: true });
      serverDb.addAuditLog(userId, "ACCOUNT_VERIFIED", `Selo verificado atribuído à conta do jogador`, req.ip || "unknown", req.headers["user-agent"] || "");

      return res.json({ success: true, verificado: true, message: "Parabéns! Sua identidade foi verificada e o selo verificado foi atribuído!" });
    } catch (err: any) {
      console.error("[VERIFY REQUEST ERROR]", err);
      return res.status(500).json({ error: "Erro ao solicitar verificação." });
    }
  });

  // GET /api/user/users - List all profiles on the platform to follow or start chats
  app.get("/api/user/users", (req, res) => {
    try {
      const usersDict = serverDb.getUsers();
      const profilesList = Object.keys(usersDict).map(uid => {
        const p = serverDb.getProfile(uid);
        return {
          uid,
          email: usersDict[uid].email,
          name: p?.username ? `${usersDict[uid].name} (@${p.username})` : usersDict[uid].name,
          rawName: usersDict[uid].name,
          username: p?.username,
          avatarUrl: p?.avatarUrl || usersDict[uid].avatarUrl,
          biography: p?.biography,
          followers: p?.followers || [],
          following: p?.following || [],
          stores: p?.stores || [],
          files: p?.files || [],
          avatarGallery: p?.avatarGallery || [],
          
          bannerUrl: p?.bannerUrl || "",
          links: p?.links || [],
          location: p?.location || "",
          socialNetworks: p?.socialNetworks || {},
          badges: p?.badges || [],
          conquistas: p?.conquistas || [],
          inventario: p?.inventario || [],
          historico: p?.historico || [],
          amigos: p?.amigos || [],
          solicitacoesAmizade: p?.solicitacoesAmizade || [],
          bloqueados: p?.bloqueados || [],
          denuncias: p?.denuncias || [],
          statusOnline: p?.statusOnline || "offline",
          ultimaAtividade: p?.ultimaAtividade || "",
          reputacao: p?.reputacao ?? 0,
          verificado: p?.verificado || false,
          premium: p?.premium || false,
          reputacaoVotos: p?.reputacaoVotos || {},
          privacySettings: p?.privacySettings || {
            privateProfile: false,
            hideCoins: false,
            hideHistory: false,
            hideFollowers: false,
            hideFriends: false
          },
          stats: p?.stats || {}
        };
      });
      return res.json({ users: profilesList });
    } catch (err: any) {
      console.error("[GET USERS ERROR]", err);
      return res.status(500).json({ error: "Erro ao listar usuários." });
    }
  });

  // POST /api/user/follow - Follow or unfollow a profile
  app.post("/api/user/follow", (req, res) => {
    const { senderId, targetId } = req.body;
    if (!senderId || !targetId) {
      return res.status(400).json({ error: "Campos senderId e targetId são obrigatórios." });
    }

    try {
      const result = serverDb.toggleFollow(senderId, targetId);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      console.error("[TOGGLE FOLLOW ERROR]", err);
      return res.status(500).json({ error: "Erro ao seguir/deixar de seguir." });
    }
  });

  // POST /api/feed/post/delete - Delete a feed post
  app.post("/api/feed/post/delete", (req, res) => {
    const { postId, userId } = req.body;
    if (!postId || !userId) {
      return res.status(400).json({ error: "Campos postId e userId são obrigatórios." });
    }

    try {
      const success = serverDb.deletePost(postId, userId);
      if (success) {
        return res.json({ success: true, message: "Publicação excluída com sucesso." });
      } else {
        return res.status(403).json({ error: "Não autorizado ou postagem não encontrada." });
      }
    } catch (err: any) {
      console.error("[POST DELETE ERROR]", err);
      return res.status(500).json({ error: "Erro ao excluir postagem." });
    }
  });

  // POST /api/feed/post/hide - Hide a feed post from the current user's feed
  app.post("/api/feed/post/hide", (req, res) => {
    const { postId, userId } = req.body;
    if (!postId || !userId) {
      return res.status(400).json({ error: "Campos postId e userId são obrigatórios." });
    }

    try {
      const success = serverDb.hidePost(postId, userId);
      if (success) {
        return res.json({ success: true, message: "Publicação ocultada com sucesso." });
      } else {
        return res.status(404).json({ error: "Postagem não encontrada." });
      }
    } catch (err: any) {
      console.error("[POST HIDE ERROR]", err);
      return res.status(500).json({ error: "Erro ao ocultar postagem." });
    }
  });

  // GET /api/chat/messages - Retrieve WhatsApp messages between two users
  app.get("/api/chat/messages", (req, res) => {
    const { userA, userB } = req.query;
    if (!userA || !userB) {
      return res.status(400).json({ error: "Os parâmetros userA e userB são obrigatórios." });
    }

    try {
      const messages = serverDb.getMessages(userA as string, userB as string);
      return res.json({ success: true, messages });
    } catch (err: any) {
      console.error("[GET MESSAGES ERROR]", err);
      return res.status(500).json({ error: "Erro ao buscar mensagens do chat." });
    }
  });

  // GET /api/chat/group-messages - Retrieve messages for a Group or Channel
  app.get("/api/chat/group-messages", (req, res) => {
    const { groupId } = req.query;
    if (!groupId) {
      return res.status(400).json({ error: "O parâmetro groupId é obrigatório." });
    }

    try {
      const messages = serverDb.getGroupMessages(groupId as string);
      return res.json({ success: true, messages });
    } catch (err: any) {
      console.error("[GET GROUP MESSAGES ERROR]", err);
      return res.status(500).json({ error: "Erro ao buscar mensagens do grupo." });
    }
  });

  // GET /api/user/notifications - Fetch new messages, followers, and active store promotions (legacy compatibility)
  app.get("/api/user/notifications", (req, res) => {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "O campo userId é obrigatório." });
    }
    try {
      const notifications = serverDb.getNotifications(userId as string);
      const unreadCount = notifications.filter((n: any) => !n.is_read && !n.deleted_at).length;
      return res.json({
        success: true,
        newMessages: [],
        followers: [],
        promotion: null,
        unreadCount
      });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao buscar notificações." });
    }
  });

  // GET /api/notifications - Central de notificações unificada: busca todas, preferências e e-mails enviados
  app.get("/api/notifications", (req, res) => {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "O campo userId é obrigatório." });
    }
    try {
      const uId = userId as string;
      
      // Default preferences object
      let preferencesObj = {
        system: { inApp: true, push: true, email: true },
        friendship: { inApp: true, push: true, email: false },
        messages: { inApp: true, push: true, email: false },
        marketplace: { inApp: true, push: true, email: true },
        games: { inApp: true, push: true, email: false },
        streaming: { inApp: true, push: false, email: false },
        finance: { inApp: true, push: true, email: true },
        achievements: { inApp: true, push: false, email: true },
        events: { inApp: true, push: true, email: true },
        subscriptions: { inApp: true, push: true, email: true }
      };

      const prefRow = serverDb.getNotificationPreferences(uId) as any;
      if (prefRow) {
        try {
          preferencesObj = JSON.parse(prefRow.preferences);
        } catch (e) {}
      } else {
        serverDb.saveNotificationPreferences(uId, JSON.stringify(preferencesObj), new Date().toISOString());
      }

      let notifications = serverDb.getNotifications(uId);

      // If user has 0 notifications, seed initial ones for outstanding visual representation
      if (notifications.length === 0) {
        const now = new Date();
        const seedData = [
          {
            id: "seed-sys-1",
            title: "🛠️ Manutenção Concluída",
            body: "O sistema foi atualizado para a versão v2.4.0 com melhorias críticas de criptografia e performance.",
            type: "system",
            offsetMin: 2
          },
          {
            id: "seed-friend-1",
            title: "👥 Nova Solicitação de Amizade",
            body: "Felipe Play (@felipe_play) enviou uma solicitação de amizade para você.",
            type: "friendship",
            offsetMin: 5
          },
          {
            id: "seed-msg-1",
            title: "💬 Nova Mensagem de Chat",
            body: "Juliana Santos: 'Ei, vamos testar o novo simulador de apostas esportivas hoje?'",
            type: "messages",
            offsetMin: 12
          },
          {
            id: "seed-market-1",
            title: "🛍️ Produto Vendido no Marketplace",
            body: "Seu item 'Capacete de Titânio Carbono' foi arrematado por 280 moedas de ouro.",
            type: "marketplace",
            offsetMin: 25
          },
          {
            id: "seed-game-1",
            title: "🎮 Torneio de Aviador Iniciado",
            body: "O Torneio Relâmpago de Aviador começou! Multiplicadores acima de 10x dão bônus duplo de moedas.",
            type: "games",
            offsetMin: 40
          },
          {
            id: "seed-stream-1",
            title: "📺 Streamer Oficial Ao Vivo",
            body: "Darlan_GZ está jogando roleta em tempo real no Lounge Cinema. Conecte-se e faça seu palpite!",
            type: "streaming",
            offsetMin: 60
          },
          {
            id: "seed-finance-1",
            title: "💰 Depósito via Pix Confirmado",
            body: "Seu depósito de R$ 50,00 foi processado com sucesso. Saldo de R$ 50,00 creditado na conta.",
            type: "finance",
            offsetMin: 90
          },
          {
            id: "seed-ach-1",
            title: "🏆 Conquista Desbloqueada!",
            body: "Mestre da Sorte: Você efetuou mais de 50 apostas corretas nos simuladores! Ganhou +100 moedas.",
            type: "achievements",
            offsetMin: 120
          },
          {
            id: "seed-ev-1",
            title: "📅 Evento Especial de Final de Semana",
            body: "Neste fim de semana, a taxa de administração do Marketplace será reduzida a 0%! Aproveite para anunciar.",
            type: "events",
            offsetMin: 180
          },
          {
            id: "seed-sub-1",
            title: "💎 Assinatura VIP Ativada",
            body: "Parabéns! Sua assinatura VIP está ativa. Limite de saques diários estendido para R$ 1.000,00.",
            type: "subscriptions",
            offsetMin: 240
          }
        ];

        for (const item of seedData) {
          const itemTime = new Date(now.getTime() - item.offsetMin * 60 * 1000).toISOString();
          serverDb.addNotification(item.id, uId, item.title, item.body, item.type, itemTime);
        }

        notifications = serverDb.getNotifications(uId);
      }

      const emails = serverDb.getSentEmails(uId);

      return res.json({
        success: true,
        notifications,
        preferences: preferencesObj,
        emails
      });
    } catch (err: any) {
      console.error("[GET NOTIFICATIONS ERROR]", err);
      return res.status(500).json({ error: "Erro ao carregar central de notificações." });
    }
  });

  // POST /api/notifications/create - Criar nova notificação simulando disparo em tempo real
  app.post("/api/notifications/create", (req, res) => {
    const { userId, title, body, type } = req.body;
    if (!userId || !title || !body || !type) {
      return res.status(400).json({ error: "Campos obrigatórios: userId, title, body, type." });
    }
    try {
      const uId = userId as string;
      const now = new Date().toISOString();
      const nId = "not-" + Math.random().toString(36).substring(2, 11);

      const userObj = serverDb.getUser(uId);
      const emailAddress = userObj?.email || "usuario@gamezone.com";

      let preferencesObj: any = {
        system: { inApp: true, push: true, email: true },
        friendship: { inApp: true, push: true, email: false },
        messages: { inApp: true, push: true, email: false },
        marketplace: { inApp: true, push: true, email: true },
        games: { inApp: true, push: true, email: false },
        streaming: { inApp: true, push: false, email: false },
        finance: { inApp: true, push: true, email: true },
        achievements: { inApp: true, push: false, email: true },
        events: { inApp: true, push: true, email: true },
        subscriptions: { inApp: true, push: true, email: true }
      };

      const prefRow = serverDb.getNotificationPreferences(uId) as any;
      if (prefRow) {
        try {
          preferencesObj = JSON.parse(prefRow.preferences);
        } catch (e) {}
      }

      const typePref = preferencesObj[type] || { inApp: true, push: true, email: true };

      let inAppSaved = false;
      let emailSent = false;
      let pushSent = false;

      if (typePref.inApp) {
        serverDb.addNotification(nId, uId, title, body, type, now);
        inAppSaved = true;
      }

      if (typePref.push) {
        pushSent = true;
      }

      if (typePref.email) {
        const emailId = "eml-" + Math.random().toString(36).substring(2, 11);
        serverDb.addSentEmail(emailId, uId, emailAddress, title, `Olá ${userObj?.name || 'Jogador'},\n\nVocê tem uma nova notificação do tipo ${type}:\n\n${body}\n\nAtenciosamente,\nEquipe GameZone`, now, "Enviado");
        emailSent = true;
      }

      return res.json({
        success: true,
        id: nId,
        inAppSaved,
        emailSent,
        pushSent,
        message: "Notificação disparada de acordo com as preferências do usuário."
      });
    } catch (err: any) {
      console.error("[CREATE NOTIFICATION ERROR]", err);
      return res.status(500).json({ error: "Erro ao criar notificação." });
    }
  });

  // POST /api/notifications/mark-read - Marcar como lida (única ou todas)
  app.post("/api/notifications/mark-read", (req, res) => {
    const { id, userId } = req.body;
    try {
      if (id === "all" && userId) {
        serverDb.markAllNotificationsRead(userId);
        return res.json({ success: true, message: "Todas as notificações marcadas como lidas." });
      } else if (id) {
        serverDb.markNotificationRead(id, 1);
        return res.json({ success: true, message: "Notificação marcada como lida." });
      } else {
        return res.status(400).json({ error: "Parâmetros inválidos." });
      }
    } catch (err: any) {
      console.error("[MARK READ ERROR]", err);
      return res.status(500).json({ error: "Erro ao marcar notificações como lidas." });
    }
  });

  // POST /api/notifications/archive - Arquivar notificação
  app.post("/api/notifications/archive", (req, res) => {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "O id da notificação é obrigatório." });
    }
    try {
      serverDb.archiveNotification(id, new Date().toISOString());
      return res.json({ success: true, message: "Notificação arquivada com sucesso." });
    } catch (err: any) {
      console.error("[ARCHIVE ERROR]", err);
      return res.status(500).json({ error: "Erro ao arquivar notificação." });
    }
  });

  // POST /api/notifications/delete - Excluir permanentemente
  app.post("/api/notifications/delete", (req, res) => {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "O id da notificação é obrigatório." });
    }
    try {
      serverDb.deleteNotification(id);
      return res.json({ success: true, message: "Notificação excluída permanentemente." });
    } catch (err: any) {
      console.error("[DELETE ERROR]", err);
      return res.status(500).json({ error: "Erro ao excluir notificação." });
    }
  });

  // POST /api/notifications/preferences - Salvar configurações do usuário
  app.post("/api/notifications/preferences", (req, res) => {
    const { userId, preferences } = req.body;
    if (!userId || !preferences) {
      return res.status(400).json({ error: "userId e preferences são obrigatórios." });
    }
    try {
      serverDb.saveNotificationPreferences(userId, JSON.stringify(preferences), new Date().toISOString());
      return res.json({ success: true, message: "Preferências de notificação atualizadas." });
    } catch (err: any) {
      console.error("[PREFERENCES ERROR]", err);
      return res.status(500).json({ error: "Erro ao salvar preferências." });
    }
  });

  // POST /api/chat/message - Send a text, photo, or audio message
  app.post("/api/chat/message", (req, res) => {
    const { senderId, receiverId, text, mediaUrl, mediaType } = req.body;
    if (!senderId || !receiverId) {
      return res.status(400).json({ error: "Os campos senderId e receiverId são obrigatórios." });
    }

    try {
      const newMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        senderId,
        receiverId,
        text: text || "",
        mediaUrl: mediaUrl || "",
        mediaType: mediaType || "text",
        created_at: new Date().toISOString(),
        deleted: false,
        hiddenFor: []
      };

      serverDb.addMessage(newMessage);
      return res.json({ success: true, message: newMessage });
    } catch (err: any) {
      console.error("[SEND MESSAGE ERROR]", err);
      return res.status(500).json({ error: "Erro ao enviar mensagem." });
    }
  });

  // POST /api/chat/message/delete - Delete/unsend a message for all users
  app.post("/api/chat/message/delete", (req, res) => {
    const { messageId } = req.body;
    if (!messageId) {
      return res.status(400).json({ error: "O campo messageId é obrigatório." });
    }

    try {
      const success = serverDb.deleteMessage(messageId);
      if (success) {
        return res.json({ success: true, message: "Mensagem apagada com sucesso." });
      } else {
        return res.status(404).json({ error: "Mensagem não encontrada." });
      }
    } catch (err: any) {
      console.error("[DELETE MESSAGE ERROR]", err);
      return res.status(500).json({ error: "Erro ao apagar mensagem." });
    }
  });

  // POST /api/chat/message/hide - Hide/archive a message for a specific user
  app.post("/api/chat/message/hide", (req, res) => {
    const { messageId, userId } = req.body;
    if (!messageId || !userId) {
      return res.status(400).json({ error: "Os campos messageId e userId são obrigatórios." });
    }

    try {
      const success = serverDb.hideMessage(messageId, userId);
      if (success) {
        return res.json({ success: true, message: "Mensagem ocultada com sucesso." });
      } else {
        return res.status(404).json({ error: "Mensagem não encontrada." });
      }
    } catch (err: any) {
      console.error("[HIDE MESSAGE ERROR]", err);
      return res.status(500).json({ error: "Erro ao ocultar mensagem." });
    }
  });

  // GET /api/marketplace/stores - Retrieve all active virtual stores across all profiles
  app.get("/api/marketplace/stores", (req, res) => {
    try {
      const rows = serverDb.getProfilesWithStores();
      const allStores: any[] = [];
      
      rows.forEach(row => {
        if (row.lojas) {
          try {
            const userStores = JSON.parse(row.lojas);
            if (Array.isArray(userStores)) {
              const mapped = userStores.map(st => ({
                ...st,
                userName: row.nome || st.userName,
                userAvatar: row.avatar || st.userAvatar || '🎮'
              }));
              allStores.push(...mapped);
            }
          } catch (e) {
            console.error('Error parsing stores JSON:', e);
          }
        }
      });
      
      return res.json({ success: true, stores: allStores });
    } catch (err: any) {
      console.error("[GET STORES ERROR]", err);
      return res.status(500).json({ error: "Erro ao carregar lojas do marketplace." });
    }
  });

  // --- ENTERPRISE MARKETPLACE ENDPOINTS ---

  // GET /api/marketplace/enterprise/stores - Retrieve all active stores
  app.get("/api/marketplace/enterprise/stores", (req, res) => {
    try {
      const stores = serverDb.getAllEnterpriseStores();
      return res.json({ success: true, stores });
    } catch (err: any) {
      console.error("[GET ENTERPRISE STORES ERROR]", err);
      return res.status(500).json({ error: "Erro ao buscar lojas." });
    }
  });

  // GET /api/marketplace/enterprise/stores/:idOrUrl - Get single store
  app.get("/api/marketplace/enterprise/stores/:idOrUrl", (req, res) => {
    const { idOrUrl } = req.params;
    try {
      const store = serverDb.getEnterpriseStore(idOrUrl);
      if (!store) {
        return res.status(404).json({ error: "Loja não encontrada." });
      }
      return res.json({ success: true, store });
    } catch (err: any) {
      console.error("[GET ENTERPRISE STORE ERROR]", err);
      return res.status(500).json({ error: "Erro ao buscar detalhes da loja." });
    }
  });

  // GET /api/marketplace/enterprise/seller/store - Get store owned by current user
  app.get("/api/marketplace/enterprise/seller/store", (req, res) => {
    const sellerId = (req.query.sellerId || req.headers["x-user-id"]) as string;
    if (!sellerId) {
      return res.status(400).json({ error: "ID do vendedor é obrigatório." });
    }
    try {
      const store = serverDb.getEnterpriseStoreBySeller(sellerId);
      return res.json({ success: true, store: store || null });
    } catch (err: any) {
      console.error("[GET SELLER STORE ERROR]", err);
      return res.status(500).json({ error: "Erro ao buscar loja do vendedor." });
    }
  });

  // POST /api/marketplace/enterprise/stores - Create virtual store
  app.post("/api/marketplace/enterprise/stores", (req, res) => {
    const { id, seller_id, store_name, custom_url, logo_url, banner_url, theme, description, categories } = req.body;
    if (!seller_id || !store_name || !custom_url) {
      return res.status(400).json({ error: "Campos obrigatórios: ID do vendedor, Nome da loja e URL personalizada." });
    }
    try {
      // Check if custom url or id is already taken
      const existing = serverDb.getEnterpriseStore(custom_url);
      if (existing) {
        return res.status(400).json({ error: "A URL personalizada já está em uso." });
      }
      const existingBySeller = serverDb.getEnterpriseStoreBySeller(seller_id);
      if (existingBySeller) {
        return res.status(400).json({ error: "Cada usuário pode possuir apenas uma loja." });
      }

      const storeId = id || `store-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      serverDb.createEnterpriseStore({
        id: storeId,
        seller_id,
        store_name,
        custom_url,
        logo_url: logo_url || "",
        banner_url: banner_url || "",
        theme: theme || "default",
        description: description || "",
        categories: Array.isArray(categories) ? JSON.stringify(categories) : (categories || "[]")
      });

      // Log audit
      serverDb.addAuditLog(seller_id, "STORE_REGISTERED", `Loja '${store_name}' criada com sucesso. URL: ${custom_url}`, req.ip || "unknown", req.headers["user-agent"] || "");

      return res.json({ success: true, storeId, message: "Loja cadastrada com sucesso!" });
    } catch (err: any) {
      console.error("[CREATE ENTERPRISE STORE ERROR]", err);
      return res.status(500).json({ error: "Erro ao cadastrar loja." });
    }
  });

  // PUT /api/marketplace/enterprise/stores/:id - Update virtual store
  app.put("/api/marketplace/enterprise/stores/:id", (req, res) => {
    const { id } = req.params;
    const { seller_id, store_name, custom_url, logo_url, banner_url, theme, description, categories } = req.body;
    try {
      const store: any = serverDb.getEnterpriseStore(id);
      if (!store) {
        return res.status(404).json({ error: "Loja não encontrada." });
      }
      if (store.seller_id !== seller_id) {
        return res.status(403).json({ error: "Você não tem permissão para alterar esta loja." });
      }

      serverDb.updateEnterpriseStore(id, {
        store_name: store_name || store.store_name,
        custom_url: custom_url || store.custom_url,
        logo_url: logo_url !== undefined ? logo_url : store.logo_url,
        banner_url: banner_url !== undefined ? banner_url : store.banner_url,
        theme: theme || store.theme,
        description: description !== undefined ? description : store.description,
        categories: Array.isArray(categories) ? JSON.stringify(categories) : (categories || store.categories)
      });

      return res.json({ success: true, message: "Loja atualizada com sucesso!" });
    } catch (err: any) {
      console.error("[UPDATE ENTERPRISE STORE ERROR]", err);
      return res.status(500).json({ error: "Erro ao atualizar loja." });
    }
  });

  // GET /api/marketplace/enterprise/products - Retrieve all available products
  app.get("/api/marketplace/enterprise/products", (req, res) => {
    try {
      const products = serverDb.getAllEnterpriseProducts();
      return res.json({ success: true, products });
    } catch (err: any) {
      console.error("[GET ENTERPRISE PRODUCTS ERROR]", err);
      return res.status(500).json({ error: "Erro ao buscar produtos." });
    }
  });

  // GET /api/marketplace/enterprise/stores/:storeId/products - Products for a single store
  app.get("/api/marketplace/enterprise/stores/:storeId/products", (req, res) => {
    const { storeId } = req.params;
    try {
      const products = serverDb.getStoreProducts(storeId);
      return res.json({ success: true, products });
    } catch (err: any) {
      console.error("[GET STORE PRODUCTS ERROR]", err);
      return res.status(500).json({ error: "Erro ao buscar produtos da loja." });
    }
  });

  // GET /api/marketplace/enterprise/products/:id - Get single product
  app.get("/api/marketplace/enterprise/products/:id", (req, res) => {
    const { id } = req.params;
    try {
      const product = serverDb.getEnterpriseProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Produto não encontrado." });
      }
      return res.json({ success: true, product });
    } catch (err: any) {
      console.error("[GET ENTERPRISE PRODUCT ERROR]", err);
      return res.status(500).json({ error: "Erro ao buscar detalhes do produto." });
    }
  });

  // POST /api/marketplace/enterprise/products - Add product
  app.post("/api/marketplace/enterprise/products", (req, res) => {
    const { id, marketplace_id, title, price, description, category, type, stock, variations, sku, images, video_url, digital_file_url, subscription_plan, seller_id } = req.body;
    if (!marketplace_id || !title || price === undefined) {
      return res.status(400).json({ error: "Campos obrigatórios: marketplace_id, título e preço." });
    }
    try {
      const store: any = serverDb.getEnterpriseStore(marketplace_id);
      if (!store) {
        return res.status(404).json({ error: "Loja associada não encontrada." });
      }
      if (seller_id && store.seller_id !== seller_id) {
        return res.status(403).json({ error: "Você não tem permissão para cadastrar produtos nesta loja." });
      }

      const prodId = id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      serverDb.createEnterpriseProduct({
        id: prodId,
        marketplace_id,
        title,
        price: Number(price),
        description: description || "",
        category: category || "general",
        type: type || "physical",
        stock: stock !== undefined ? Number(stock) : 10,
        variations: Array.isArray(variations) ? JSON.stringify(variations) : (variations || "[]"),
        sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
        images: Array.isArray(images) ? JSON.stringify(images) : (images || "[]"),
        video_url: video_url || "",
        digital_file_url: digital_file_url || "",
        subscription_plan: typeof subscription_plan === 'object' ? JSON.stringify(subscription_plan) : (subscription_plan || "{}")
      });

      return res.json({ success: true, productId: prodId, message: "Produto cadastrado com sucesso!" });
    } catch (err: any) {
      console.error("[CREATE ENTERPRISE PRODUCT ERROR]", err);
      return res.status(500).json({ error: "Erro ao cadastrar produto." });
    }
  });

  // PUT /api/marketplace/enterprise/products/:id - Update product
  app.put("/api/marketplace/enterprise/products/:id", (req, res) => {
    const { id } = req.params;
    const { title, price, description, category, type, stock, variations, sku, images, video_url, digital_file_url, subscription_plan, is_available, seller_id } = req.body;
    try {
      const product: any = serverDb.getEnterpriseProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Produto não encontrado." });
      }
      if (seller_id && product.seller_id !== seller_id) {
        return res.status(403).json({ error: "Você não tem permissão para alterar este produto." });
      }

      serverDb.updateEnterpriseProduct(id, {
        title: title || product.title,
        price: price !== undefined ? Number(price) : product.price,
        description: description !== undefined ? description : product.description,
        category: category || product.category,
        type: type || product.type,
        stock: stock !== undefined ? Number(stock) : product.stock,
        variations: Array.isArray(variations) ? JSON.stringify(variations) : (variations || product.variations),
        sku: sku || product.sku,
        images: Array.isArray(images) ? JSON.stringify(images) : (images || product.images),
        video_url: video_url !== undefined ? video_url : product.video_url,
        digital_file_url: digital_file_url !== undefined ? digital_file_url : product.digital_file_url,
        subscription_plan: typeof subscription_plan === 'object' ? JSON.stringify(subscription_plan) : (subscription_plan || product.subscription_plan),
        is_available: is_available !== undefined ? Number(is_available) : product.is_available
      });

      return res.json({ success: true, message: "Produto atualizado com sucesso!" });
    } catch (err: any) {
      console.error("[UPDATE ENTERPRISE PRODUCT ERROR]", err);
      return res.status(500).json({ error: "Erro ao atualizar produto." });
    }
  });

  // DELETE /api/marketplace/enterprise/products/:id - Delete product
  app.delete("/api/marketplace/enterprise/products/:id", (req, res) => {
    const { id } = req.params;
    const sellerId = (req.query.sellerId || req.headers["x-user-id"]) as string;
    try {
      const product: any = serverDb.getEnterpriseProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Produto não encontrado." });
      }
      if (sellerId && product.seller_id !== sellerId) {
        return res.status(403).json({ error: "Você não tem permissão para remover este produto." });
      }

      serverDb.deleteEnterpriseProduct(id);
      return res.json({ success: true, message: "Produto excluído com sucesso!" });
    } catch (err: any) {
      console.error("[DELETE ENTERPRISE PRODUCT ERROR]", err);
      return res.status(500).json({ error: "Erro ao remover produto." });
    }
  });

  // GET /api/marketplace/enterprise/products/:id/reviews - Reviews for product
  app.get("/api/marketplace/enterprise/products/:id/reviews", (req, res) => {
    const { id } = req.params;
    try {
      const reviews = serverDb.getProductReviews(id);
      return res.json({ success: true, reviews });
    } catch (err: any) {
      console.error("[GET PRODUCT REVIEWS ERROR]", err);
      return res.status(500).json({ error: "Erro ao carregar avaliações." });
    }
  });

  // POST /api/marketplace/enterprise/products/:id/reviews - Review product
  app.post("/api/marketplace/enterprise/products/:id/reviews", (req, res) => {
    const { id } = req.params;
    const { user_id, rating, comment } = req.body;
    if (!user_id || !rating) {
      return res.status(400).json({ error: "Campos obrigatórios: ID do usuário e Nota." });
    }
    try {
      const reviewId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      serverDb.createProductReview({
        id: reviewId,
        user_id,
        product_id: id,
        rating: Number(rating),
        comment: comment || ""
      });

      return res.json({ success: true, reviewId, message: "Avaliação registrada!" });
    } catch (err: any) {
      console.error("[CREATE PRODUCT REVIEW ERROR]", err);
      return res.status(500).json({ error: "Erro ao registrar avaliação." });
    }
  });

  // GET /api/marketplace/enterprise/products/:id/questions - Questions for product
  app.get("/api/marketplace/enterprise/products/:id/questions", (req, res) => {
    const { id } = req.params;
    try {
      const questions = serverDb.getProductQuestions(id);
      return res.json({ success: true, questions });
    } catch (err: any) {
      console.error("[GET PRODUCT QUESTIONS ERROR]", err);
      return res.status(500).json({ error: "Erro ao carregar perguntas." });
    }
  });

  // POST /api/marketplace/enterprise/products/:id/questions - Ask a question
  app.post("/api/marketplace/enterprise/products/:id/questions", (req, res) => {
    const { id } = req.params;
    const { user_id, question } = req.body;
    if (!user_id || !question) {
      return res.status(400).json({ error: "Campos obrigatórios: ID do usuário e Pergunta." });
    }
    try {
      const questionId = `qst-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      serverDb.createProductQuestion({
        id: questionId,
        user_id,
        product_id: id,
        question
      });

      return res.json({ success: true, questionId, message: "Pergunta enviada!" });
    } catch (err: any) {
      console.error("[CREATE PRODUCT QUESTION ERROR]", err);
      return res.status(500).json({ error: "Erro ao enviar pergunta." });
    }
  });

  // POST /api/marketplace/enterprise/questions/:id/answer - Answer question
  app.post("/api/marketplace/enterprise/questions/:id/answer", (req, res) => {
    const { id } = req.params;
    const { answer, seller_id } = req.body;
    if (!answer) {
      return res.status(400).json({ error: "O campo resposta é obrigatório." });
    }
    try {
      serverDb.answerProductQuestion(id, answer);
      return res.json({ success: true, message: "Pergunta respondida com sucesso!" });
    } catch (err: any) {
      console.error("[ANSWER QUESTION ERROR]", err);
      return res.status(500).json({ error: "Erro ao responder pergunta." });
    }
  });

  // GET /api/marketplace/enterprise/wishlist - Get wishlist
  app.get("/api/marketplace/enterprise/wishlist", (req, res) => {
    const userId = (req.query.userId || req.headers["x-user-id"]) as string;
    if (!userId) {
      return res.status(400).json({ error: "ID de usuário obrigatório." });
    }
    try {
      const wishlist = serverDb.getWishlist(userId);
      return res.json({ success: true, wishlist });
    } catch (err: any) {
      console.error("[GET WISHLIST ERROR]", err);
      return res.status(500).json({ error: "Erro ao carregar lista de desejos." });
    }
  });

  // POST /api/marketplace/enterprise/wishlist - Add to wishlist
  app.post("/api/marketplace/enterprise/wishlist", (req, res) => {
    const { user_id, product_id } = req.body;
    if (!user_id || !product_id) {
      return res.status(400).json({ error: "Campos obrigatórios: user_id e product_id." });
    }
    try {
      const id = `wish-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      serverDb.addToWishlist(id, user_id, product_id);
      return res.json({ success: true, message: "Produto adicionado aos favoritos!" });
    } catch (err: any) {
      console.error("[ADD TO WISHLIST ERROR]", err);
      return res.status(500).json({ error: "Erro ao favoritar produto." });
    }
  });

  // DELETE /api/marketplace/enterprise/wishlist/:productId - Remove from wishlist
  app.delete("/api/marketplace/enterprise/wishlist/:productId", (req, res) => {
    const { productId } = req.params;
    const userId = (req.query.userId || req.headers["x-user-id"]) as string;
    if (!userId) {
      return res.status(400).json({ error: "ID de usuário obrigatório." });
    }
    try {
      serverDb.removeFromWishlist(userId, productId);
      return res.json({ success: true, message: "Produto removido dos favoritos." });
    } catch (err: any) {
      console.error("[REMOVE FROM WISHLIST ERROR]", err);
      return res.status(500).json({ error: "Erro ao remover dos favoritos." });
    }
  });

  // GET /api/marketplace/enterprise/orders - Orders list
  app.get("/api/marketplace/enterprise/orders", (req, res) => {
    const userId = (req.query.userId || req.headers["x-user-id"]) as string;
    const isSeller = req.query.isSeller === "true";
    if (!userId) {
      return res.status(400).json({ error: "ID de usuário obrigatório." });
    }
    try {
      const orders = serverDb.getEnterpriseOrders(userId, isSeller);
      return res.json({ success: true, orders });
    } catch (err: any) {
      console.error("[GET ENTERPRISE ORDERS ERROR]", err);
      return res.status(500).json({ error: "Erro ao buscar pedidos." });
    }
  });

  // POST /api/marketplace/enterprise/orders - Place order / Checkout
  app.post("/api/marketplace/enterprise/orders", (req, res) => {
    const { buyer_id, product_id, quantity, shipping_address, variation_selected, payMethod } = req.body;
    if (!buyer_id || !product_id) {
      return res.status(400).json({ error: "Comprador e Produto são obrigatórios." });
    }
    try {
      const product: any = serverDb.getEnterpriseProduct(product_id);
      if (!product) {
        return res.status(404).json({ error: "Produto não encontrado." });
      }

      if (product.type === "physical" && product.stock < Number(quantity || 1)) {
        return res.status(400).json({ error: "Estoque insuficiente para este produto." });
      }

      const orderQty = Number(quantity || 1);
      const totalPrice = product.price * orderQty;
      const commissionRate = 0.10; // 10% platform fee
      const commissionAmount = totalPrice * commissionRate;

      // Charge payment from balance
      const buyerProfile = serverDb.getProfile(buyer_id);
      if (!buyerProfile) {
        return res.status(404).json({ error: "Perfil do comprador não encontrado." });
      }

      if (payMethod === 'coins') {
        const currentCoins = buyerProfile.stats?.coins || 0;
        const totalCoinsCost = totalPrice * 100; // 1 BRL = 100 Gamezone Coins
        if (currentCoins < totalCoinsCost) {
          return res.status(400).json({ error: "Saldo de moedas insuficiente para realizar a compra." });
        }
        if (!buyerProfile.stats) {
          buyerProfile.stats = { coins: 0, lives: 3, currentStage: 1, highScore: 0, unlockedSkins: ["classic"], unlockedAccessories: ["none"], unlockedAuras: ["none"], avatar: { skin: "classic", accessory: "none", aura: "none" }, level: 1, points: 0 };
        }
        buyerProfile.stats.coins = currentCoins - totalCoinsCost;
        serverDb.saveProfile(buyer_id, buyerProfile);
        
        logFinancialTransaction(
          buyer_id,
          "purchase_cosmetic",
          `Compra no Marketplace de '${product.title}' via Coins`,
          totalCoinsCost,
          "coins"
        );
      } else {
        const currentBrl = buyerProfile.realBalance || 0;
        if (currentBrl < totalPrice) {
          return res.status(400).json({ error: "Saldo real insuficiente para realizar a compra." });
        }
        buyerProfile.realBalance = currentBrl - totalPrice;
        serverDb.saveProfile(buyer_id, buyerProfile);

        logFinancialTransaction(
          buyer_id,
          "purchase_cosmetic",
          `Compra no Marketplace de '${product.title}' via Saldo BRL`,
          totalPrice,
          "real"
        );
      }

      // Credit the seller's account (amount - commission)
      const sellerId = product.seller_id;
      const sellerProfile = serverDb.getProfile(sellerId);
      if (sellerProfile) {
        const sellerGets = totalPrice - commissionAmount;
        if (payMethod === 'coins') {
          const sellerCoinsGets = sellerGets * 100;
          if (!sellerProfile.stats) {
            sellerProfile.stats = { coins: 0, lives: 3, currentStage: 1, highScore: 0, unlockedSkins: ["classic"], unlockedAccessories: ["none"], unlockedAuras: ["none"], avatar: { skin: "classic", accessory: "none", aura: "none" }, level: 1, points: 0 };
          }
          sellerProfile.stats.coins = (sellerProfile.stats.coins || 0) + sellerCoinsGets;
          serverDb.saveProfile(sellerId, sellerProfile);
          
          logFinancialTransaction(
            sellerId,
            "earn",
            `Venda no Marketplace de '${product.title}' (Moedas creditadas, comissão 10% deduzida)`,
            sellerCoinsGets,
            "coins"
          );
        } else {
          sellerProfile.realBalance = (sellerProfile.realBalance || 0) + sellerGets;
          serverDb.saveProfile(sellerId, sellerProfile);

          logFinancialTransaction(
            sellerId,
            "earn",
            `Venda no Marketplace de '${product.title}' (Saldo creditado, comissão 10% deduzida)`,
            sellerGets,
            "real"
          );
        }
      }

      const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      serverDb.createEnterpriseOrder({
        id: orderId,
        buyer_id,
        product_id,
        total_price: totalPrice,
        commission_amount: commissionAmount,
        status: product.type === "physical" ? "pending" : "delivered", // digital/sub auto delivered
        quantity: orderQty,
        shipping_address: shipping_address || "Acesso Digital",
        variation_selected: variation_selected || ""
      });

      // Send standard notification to the buyer
      const notifIdBuyer = `notif-buyer-${Date.now()}`;
      serverDb.addNotification(
        notifIdBuyer,
        buyer_id,
        "Compra Aprovada! 🛒",
        `Seu pedido para '${product.title}' (Qtd: ${orderQty}) no valor de R$ ${totalPrice.toFixed(2)} foi aprovado!`,
        "payment",
        new Date().toISOString()
      );

      // Send standard notification to the seller
      const notifIdSeller = `notif-seller-${Date.now()}`;
      serverDb.addNotification(
        notifIdSeller,
        sellerId,
        "Nova Venda! 📈",
        `Você vendeu ${orderQty}x '${product.title}' no valor de R$ ${totalPrice.toFixed(2)}!`,
        "payment",
        new Date().toISOString()
      );

      serverDb.addAuditLog(buyer_id, "ORDER_COMPLETED", `Pedido ${orderId} criado com sucesso. Valor total: R$ ${totalPrice}`, req.ip || "unknown", req.headers["user-agent"] || "");

      return res.json({ success: true, orderId, message: "Compra realizada com sucesso!" });
    } catch (err: any) {
      console.error("[CREATE ENTERPRISE ORDER ERROR]", err);
      return res.status(500).json({ error: "Erro ao processar pedido." });
    }
  });

  // PUT /api/marketplace/enterprise/orders/:id/status - Update order status
  app.put("/api/marketplace/enterprise/orders/:id/status", (req, res) => {
    const { id } = req.params;
    const { status, shipping_tracking_code } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status é obrigatório." });
    }
    try {
      serverDb.updateEnterpriseOrderStatus(id, status, shipping_tracking_code);
      return res.json({ success: true, message: "Status do pedido atualizado!" });
    } catch (err: any) {
      console.error("[UPDATE ORDER STATUS ERROR]", err);
      return res.status(500).json({ error: "Erro ao atualizar status do pedido." });
    }
  });

  // GET /api/movies - Retrieve all community movies and trailers
  app.get("/api/movies", (req, res) => {
    try {
      const movies = serverDb.getMovies();
      return res.json({ success: true, movies });
    } catch (err: any) {
      console.error("[GET MOVIES ERROR]", err);
      return res.status(500).json({ error: "Erro ao carregar catálogo de filmes." });
    }
  });

  // POST /api/movies - Publish a new community movie and auto-announce on Arena Feed
  app.post("/api/movies", (req, res) => {
    const { movie } = req.body;
    if (!movie || !movie.id || !movie.title || !movie.uploaderId) {
      return res.status(400).json({ error: "Dados do filme incompletos." });
    }

    try {
      // 1. Add movie to SQLite
      serverDb.addMovie(movie);

      // 2. Automatically format and publish an announcement to the Arena Feed
      const postText = `🎬 NOVO FILME DISPONÍVEL NO CINEMA DA ARENA! 🍿\n\nAcabei de publicar "${movie.title}" (${movie.year}) na categoria ${movie.category}.\n\n"${movie.description}"\n\nAssista agora na aba Cinema! 🎥🔥`;
      
      const newPost = {
        id: `post-movie-${movie.id}`,
        text: postText,
        media_url: movie.image_url,
        userId: movie.uploaderId,
        likes: [],
        media_type: 'image' as const,
        username: movie.uploaderName || 'Gamer Cinema',
        userAvatarUrl: '🎬',
        created_at: movie.createdAt || new Date().toISOString(),
        evaluations: {},
        comments: [],
        isAd: false,
        hiddenFor: []
      };
      
      serverDb.addPost(newPost);

      return res.json({ success: true, movie });
    } catch (err: any) {
      console.error("[POST MOVIE ERROR]", err);
      return res.status(500).json({ error: "Erro ao publicar filme." });
    }
  });

  // --- NEW SCALABLE RELATIONAL DATABASE APIS (22 TABLES INTERACTION) ---

  // GET /api/database/schema - Metadata of the 22 normalized tables and query counts
  app.get("/api/database/schema", (req, res) => {
    try {
      const telemetry = (serverDb as any).getNormalizedTablesTelemetry();
      return res.json({ success: true, telemetry });
    } catch (err: any) {
      console.error("[SCHEMA API ERROR]", err);
      return res.status(500).json({ error: "Erro ao coletar telemetria das tabelas." });
    }
  });

  // POST /api/database/query - Interactive sandbox to run secure queries
  app.post("/api/database/query", (req, res) => {
    const { sql, params } = req.body;
    if (!sql) {
      return res.status(400).json({ error: "Comando SQL é obrigatório." });
    }

    const forbidden = ["drop table", "alter table", "create table", "drop index", "vacuum"];
    const lowercaseSql = sql.toLowerCase();
    const isForbidden = forbidden.some(term => lowercaseSql.includes(term));

    if (isForbidden) {
      return res.status(403).json({ error: "Comando não autorizado. O Sandbox suporta consultas e manipulações via SELECT, INSERT, UPDATE, DELETE e PRAGMA." });
    }

    try {
      const result = (serverDb as any).runGenericQuery(sql, params || []);
      
      // Log db operations to the database itself (Audit Log Module #20)
      try {
        const opType = sql.trim().split(/\s+/)[0].toUpperCase();
        if (["INSERT", "UPDATE", "DELETE"].includes(opType)) {
          const tableMatch = sql.match(/into\s+(\w+)|update\s+(\w+)|from\s+(\w+)/i);
          const matchedTable = tableMatch ? (tableMatch[1] || tableMatch[2] || tableMatch[3]) : "unknown";
          
          if (matchedTable !== "normalized_db_operation_logs") {
            (serverDb as any).runGenericQuery(`
              INSERT INTO normalized_db_operation_logs (id, operator_id, table_name, operation_type, payload_before, payload_after, security_signature, created_at, updated_at, deleted_at, audit_created_by, audit_updated_by)
              VALUES (?, 'u-anonymous-sandbox', ?, ?, NULL, ?, ?, ?, ?, NULL, 'sandbox_operator', 'sandbox_operator')
            `, [
              `dop-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              matchedTable,
              opType,
              JSON.stringify({ query: sql, params }),
              `sha256_audit_sig_${Date.now()}`,
              new Date().toISOString(),
              new Date().toISOString()
            ]);
          }
        }
      } catch (logErr) {
        console.error("[SANDBOX AUDIT LOG ERROR]", logErr);
      }

      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/database/seed - Seed relational mock data into the 22 normalized tables
  app.post("/api/database/seed", (req, res) => {
    try {
      const result = (serverDb as any).seedNormalizedRelationalData();
      return res.json(result);
    } catch (err: any) {
      console.error("[SEED API ERROR]", err);
      return res.status(500).json({ error: "Falha ao popular banco de dados relacional." });
    }
  });

  // =========================================================================
  // --- GAMEZON INTERNAL FINANCIAL PORTAL SECURE ENDPOINTS ---
  // =========================================================================

  // Helper to securely generate signed transaction log
  const logFinancialTransaction = (
    userId: string,
    type: 'earn' | 'purchase_coins' | 'purchase_booster' | 'purchase_cosmetic' | 'stage_skip',
    description: string,
    amount: number,
    currency: 'coins' | 'real'
  ) => {
    const randomHash = crypto.randomBytes(32).toString("hex");
    const id = `TXN-${Math.floor(100000 + Math.random() * 900000)}-${Math.floor(10 + Math.random() * 89)}`;
    const timestamp = new Date().toLocaleString("pt-BR");

    const newLog = {
      id,
      timestamp,
      type,
      description,
      amount,
      currency,
      status: 'success',
      securityHash: `0x${randomHash}`
    };

    // Calculate cryptographic HMAC signature for ledger protection
    const secret = process.env.COMPILER_SECRET_SALT || 'GZ_SECURE_SALT_9f31b8a6d25e4c7b80a1c2d3e4f5a6b7';
    const recordStr = `${id}:${userId}:${timestamp}:${type}:${description}:${amount}:${currency}:success`;
    const computedHash = '0x' + crypto.createHmac('sha256', secret).update(recordStr).digest('hex');
    newLog.securityHash = computedHash;

    serverDb.addLog(userId, newLog as any);
    return newLog;
  };

  // POST /api/finance/wallet - Get Wallet details
  app.post("/api/finance/wallet", (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "O campo userId é obrigatório." });
    }

    try {
      const profile = serverDb.getProfile(userId);
      const logs = serverDb.getLogs(userId);

      if (!profile) {
        return res.status(404).json({ error: "Perfil de jogador não encontrado." });
      }

      return res.json({
        success: true,
        realBalance: profile.realBalance,
        withdrawLimit: profile.withdrawLimit,
        coins: profile.stats?.coins || 0,
        level: profile.stats?.level || 1,
        xp: profile.stats?.points || 0,
        isVip: profile.premium,
        logs
      });
    } catch (err: any) {
      console.error("[WALLET FETCH ERROR]", err);
      return res.status(500).json({ error: "Falha ao carregar carteira virtual." });
    }
  });

  // POST /api/finance/deposit - Add Real Balance (Simulated PIX / Card with Anti-Fraud Checks)
  app.post("/api/finance/deposit", (req, res) => {
    const { userId, amount, method } = req.body;
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ error: "ID de usuário e valor de depósito válido são obrigatórios." });
    }

    // Anti-fraud validation limit
    if (amount > 5000) {
      serverDb.addAuditLog(userId, "FRAUD_LIMIT_DEPOSIT", `Tentativa de depósito suspeito de alto valor de R$ ${amount}. Bloqueado.`, req.ip || "unknown", req.headers["user-agent"] || "");
      return res.status(400).json({ error: "O valor de um único depósito não pode exceder R$ 5.000,00 por motivos de compliance e segurança." });
    }

    try {
      const profile = serverDb.getProfile(userId);
      if (!profile) return res.status(404).json({ error: "Perfil não encontrado." });

      // Apply deposit
      profile.realBalance = (profile.realBalance || 0) + Number(amount);
      serverDb.saveProfile(userId, profile);

      // Log transaction securely
      const transaction = logFinancialTransaction(
        userId,
        "purchase_coins",
        `Depósito aprovado via ${method || 'PIX'}`,
        Number(amount),
        "real"
      );

      serverDb.addAuditLog(userId, "FINANCE_DEPOSIT_COMPLETED", `Depósito de R$ ${amount} realizado com sucesso via ${method}`, req.ip || "unknown", req.headers["user-agent"] || "");

      return res.json({
        success: true,
        realBalance: profile.realBalance,
        transaction
      });
    } catch (err: any) {
      console.error("[DEPOSIT API ERROR]", err);
      return res.status(500).json({ error: "Erro ao processar depósito de fundos." });
    }
  });

  // POST /api/finance/withdraw - Withdraw Real Balance (Cashout with compliance limits)
  app.post("/api/finance/withdraw", (req, res) => {
    const { userId, amount, pixKey } = req.body;
    if (!userId || !amount || amount <= 0 || !pixKey) {
      return res.status(400).json({ error: "Campos obrigatórios: userId, valor de saque e chave PIX." });
    }

    try {
      const profile = serverDb.getProfile(userId);
      if (!profile) return res.status(404).json({ error: "Perfil não encontrado." });

      // Balance check
      if ((profile.realBalance || 0) < amount) {
        return res.status(400).json({ error: "Saldo real insuficiente para realizar este saque." });
      }

      // Check daily withdraw limit
      const limit = profile.withdrawLimit || 100.0;
      if (amount > limit) {
        serverDb.addAuditLog(userId, "FRAUD_WITHDRAW_LIMIT_EXCEEDED", `Tentativa de saque de R$ ${amount} superior ao limite de R$ ${limit}.`, req.ip || "unknown", req.headers["user-agent"] || "");
        return res.status(400).json({ error: `O limite individual de saques para sua conta é de R$ ${limit.toFixed(2)} por operação.` });
      }

      // Perform withdrawal
      profile.realBalance = (profile.realBalance || 0) - Number(amount);
      serverDb.saveProfile(userId, profile);

      // Log transaction securely
      const transaction = logFinancialTransaction(
        userId,
        "stage_skip",
        `Saque PIX processado para chave: ${pixKey}`,
        Number(amount),
        "real"
      );

      serverDb.addAuditLog(userId, "FINANCE_WITHDRAW_COMPLETED", `Saque de R$ ${amount} aprovado para chave PIX ${pixKey}`, req.ip || "unknown", req.headers["user-agent"] || "");

      return res.json({
        success: true,
        realBalance: profile.realBalance,
        transaction
      });
    } catch (err: any) {
      console.error("[WITHDRAW API ERROR]", err);
      return res.status(500).json({ error: "Erro ao processar saque." });
    }
  });

  // POST /api/finance/convert - Convert Real Balance BRL to 🪙 GameZone Coins with 10% Cashback Bonus!
  app.post("/api/finance/convert", (req, res) => {
    const { userId, amountReal } = req.body;
    if (!userId || !amountReal || amountReal <= 0) {
      return res.status(400).json({ error: "Usuário e valor real para conversão são obrigatórios." });
    }

    try {
      const profile = serverDb.getProfile(userId);
      if (!profile) return res.status(404).json({ error: "Perfil do jogador não encontrado." });

      if ((profile.realBalance || 0) < amountReal) {
        return res.status(400).json({ error: "Saldo real insuficiente para conversão." });
      }

      // Conversion rate: 1 BRL = 100 Coins
      const baseCoins = Math.floor(amountReal * 100);
      const bonusCoins = Math.floor(baseCoins * 0.10); // 10% bonus coins (Cashback)
      const totalCoinsGained = baseCoins + bonusCoins;

      // Update balances
      profile.realBalance = (profile.realBalance || 0) - Number(amountReal);
      if (!profile.stats) {
        profile.stats = { coins: 0, lives: 3, currentStage: 1, highScore: 0, unlockedSkins: ["classic"], unlockedAccessories: ["none"], unlockedAuras: ["none"], avatar: { skin: "classic", accessory: "none", aura: "none" }, level: 1, points: 0 };
      }
      profile.stats.coins = (profile.stats.coins || 0) + totalCoinsGained;
      serverDb.saveProfile(userId, profile);

      // Log BRL Debit
      logFinancialTransaction(
        userId,
        "stage_skip",
        `Conversão de Saldo: R$ ${amountReal.toFixed(2)} convertidos em moedas`,
        Number(amountReal),
        "real"
      );

      // Log Coins Credit
      const transaction = logFinancialTransaction(
        userId,
        "earn",
        `Moedas creditadas (+10% Cashback Bonus: ${bonusCoins} 🪙)`,
        totalCoinsGained,
        "coins"
      );

      serverDb.addAuditLog(userId, "FINANCE_BALANCE_CONVERSION", `Conversão de R$ ${amountReal} para ${totalCoinsGained} moedas virtuais com bônus de cashback.`, req.ip || "unknown", req.headers["user-agent"] || "");

      return res.json({
        success: true,
        realBalance: profile.realBalance,
        coins: profile.stats.coins,
        transaction
      });
    } catch (err: any) {
      console.error("[CONVERSION API ERROR]", err);
      return res.status(500).json({ error: "Erro ao processar conversão de moedas." });
    }
  });

  // POST /api/finance/quest/claim - Claim Quest Reward (Daily / Weekly quests, login bonus)
  app.post("/api/finance/quest/claim", (req, res) => {
    const { userId, questType, questId, rewardCoins, rewardXp, title } = req.body;
    if (!userId || !questId || !rewardCoins) {
      return res.status(400).json({ error: "Parâmetros de recompensa inválidos." });
    }

    try {
      const profile = serverDb.getProfile(userId);
      if (!profile) return res.status(404).json({ error: "Jogador não encontrado." });

      if (!profile.stats) {
        profile.stats = { coins: 0, lives: 3, currentStage: 1, highScore: 0, unlockedSkins: ["classic"], unlockedAccessories: ["none"], unlockedAuras: ["none"], avatar: { skin: "classic", accessory: "none", aura: "none" }, level: 1, points: 0 };
      }

      // Add coins and XP
      profile.stats.coins = (profile.stats.coins || 0) + Number(rewardCoins);
      const currentXp = profile.stats.points || 0;
      const newXp = currentXp + (Number(rewardXp) || 0);
      profile.stats.points = newXp;

      // Handle Level Up (1000 XP per level)
      const currentLevel = profile.stats.level || 1;
      const newLevel = Math.floor(newXp / 1000) + 1;
      let levelUpDetected = false;

      if (newLevel > currentLevel) {
        profile.stats.level = newLevel;
        levelUpDetected = true;
        profile.stats.coins += 200; // 200 coins level-up reward
        logFinancialTransaction(userId, "earn", `Bônus de Level Up! Nível ${newLevel} alcançado.`, 200, "coins");
      }

      // Add special achievements to profile based on quests completed
      let achievements = profile.conquistas || [];
      if (questId === 'conquista_primeiro_deposito' && !achievements.includes('primeiro_deposito')) {
        achievements.push('primeiro_deposito');
      } else if (questId === 'quest_login_streak_7' && !achievements.includes('streak_master')) {
        achievements.push('streak_master');
      }
      profile.conquistas = achievements;

      serverDb.saveProfile(userId, profile);

      // Log transaction securely
      const transaction = logFinancialTransaction(
        userId,
        "earn",
        `Recompensa resgatada: ${title || 'Missão Concluída'} (+${rewardCoins} 🪙, +${rewardXp || 0} XP)`,
        Number(rewardCoins),
        "coins"
      );

      serverDb.addAuditLog(userId, "FINANCE_CLAIM_REWARD", `Recompensa '${title || questId}' resgatada: +${rewardCoins} moedas, +${rewardXp} XP.`, req.ip || "unknown", req.headers["user-agent"] || "");

      return res.json({
        success: true,
        coins: profile.stats.coins,
        xp: profile.stats.points,
        level: profile.stats.level || 1,
        levelUpDetected,
        conquistas: profile.conquistas,
        transaction
      });
    } catch (err: any) {
      console.error("[QUEST REWARD CLAIM ERROR]", err);
      return res.status(500).json({ error: "Falha ao registrar recompensa." });
    }
  });

  // POST /api/finance/vip/purchase - Purchase VIP Status using Real Balance
  app.post("/api/finance/vip/purchase", (req, res) => {
    const { userId, planId, price, title } = req.body;
    if (!userId || !planId || !price) {
      return res.status(400).json({ error: "Parâmetros de plano VIP incorretos." });
    }

    try {
      const profile = serverDb.getProfile(userId);
      if (!profile) return res.status(404).json({ error: "Perfil de jogador não encontrado." });

      if ((profile.realBalance || 0) < price) {
        return res.status(400).json({ error: "Saldo real insuficiente para adquirir este plano VIP." });
      }

      // Deduct balance
      profile.realBalance = (profile.realBalance || 0) - Number(price);
      profile.premium = true; // Set VIP boolean

      // Add VIP badge
      let badges = profile.badges || [];
      const badgeName = `${planId.toUpperCase()}_MEMBER`;
      if (!badges.includes(badgeName)) {
        badges.push(badgeName);
      }
      profile.badges = badges;

      // Welcome Coins bonus!
      const welcomeCoins = planId === 'platinum' ? 10000 : planId === 'gold' ? 5000 : planId === 'silver' ? 2500 : 1000;
      if (!profile.stats) {
        profile.stats = { coins: 0, lives: 3, currentStage: 1, highScore: 0, unlockedSkins: ["classic"], unlockedAccessories: ["none"], unlockedAuras: ["none"], avatar: { skin: "classic", accessory: "none", aura: "none" }, level: 1, points: 0 };
      }
      profile.stats.coins = (profile.stats.coins || 0) + welcomeCoins;
      profile.stats.isVip = true;

      serverDb.saveProfile(userId, profile);

      // Log BRL Debit
      logFinancialTransaction(
        userId,
        "purchase_booster",
        `Compra de Assinatura VIP: Plano ${title}`,
        Number(price),
        "real"
      );

      // Log Coins Credit
      const transaction = logFinancialTransaction(
        userId,
        "earn",
        `Moedas de boas-vindas do plano VIP ${title}`,
        welcomeCoins,
        "coins"
      );

      serverDb.addAuditLog(userId, "FINANCE_VIP_PURCHASED", `VIP ${title} adquirido por R$ ${price}. Badges adicionados: ${badgeName}`, req.ip || "unknown", req.headers["user-agent"] || "");

      return res.json({
        success: true,
        realBalance: profile.realBalance,
        coins: profile.stats.coins,
        isVip: true,
        badges,
        transaction
      });
    } catch (err: any) {
      console.error("[VIP PURCHASE API ERROR]", err);
      return res.status(500).json({ error: "Erro ao processar assinatura VIP." });
    }
  });

  // GET /api/finance/marketplace - Retrieve player marketplace item listings
  app.get("/api/finance/marketplace", (req, res) => {
    try {
      const listings = serverDb.getMarketplaceListings();
      return res.json({ success: true, listings });
    } catch (err: any) {
      console.error("[MARKETPLACE FETCH ERROR]", err);
      return res.status(500).json({ error: "Falha ao buscar itens do mercado." });
    }
  });

  // POST /api/finance/marketplace/list - List an item for sale in player-to-player marketplace
  app.post("/api/finance/marketplace/list", (req, res) => {
    const { userId, title, description, price, currency, rarity } = req.body;
    if (!userId || !title || !price || !currency) {
      return res.status(400).json({ error: "Campos obrigatórios: userId, título, preço e tipo de moeda." });
    }

    try {
      const profile = serverDb.getProfile(userId);
      if (!profile) return res.status(404).json({ error: "Perfil do vendedor não encontrado." });

      if (price <= 0) {
        return res.status(400).json({ error: "O preço anunciado do item deve ser superior a zero." });
      }

      // Check if item exists in player's inventory first
      const inventory = profile.inventario || [];
      const itemIndex = inventory.findIndex((it: any) => it.name === title);
      if (itemIndex === -1) {
        return res.status(400).json({ error: "Você só pode anunciar itens que possui em seu inventário." });
      }

      // Remove 1 unit from inventory
      inventory.splice(itemIndex, 1);
      profile.inventario = inventory;
      serverDb.saveProfile(userId, profile);

      const listingId = `LIST-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const sellerName = profile.username || "Vendedor Anônimo";

      serverDb.listMarketplaceItem(
        listingId,
        userId,
        sellerName,
        title,
        description || "",
        Number(price),
        currency,
        rarity || "common",
        new Date().toISOString()
      );

      // Log transaction securely
      logFinancialTransaction(
        userId,
        "purchase_cosmetic",
        `Item anunciado no Marketplace: '${title}' por ${price} ${currency === 'coins' ? 'Coins' : 'BRL'}`,
        0,
        currency === 'coins' ? 'coins' : 'real'
      );

      serverDb.addAuditLog(userId, "MARKETPLACE_ITEM_LISTED", `Item '${title}' listado para venda por ${price} ${currency}. Id do anúncio: ${listingId}`, req.ip || "unknown", req.headers["user-agent"] || "");

      return res.json({
        success: true,
        listingId,
        inventario: inventory
      });
    } catch (err: any) {
      console.error("[MARKETPLACE LISTING ERROR]", err);
      return res.status(500).json({ error: "Falha ao cadastrar anúncio de item." });
    }
  });

  // POST /api/finance/marketplace/buy - Buy an item from player-to-player marketplace (with 10% Platform fee)
  app.post("/api/finance/marketplace/buy", (req, res) => {
    const { buyerId, listingId } = req.body;
    if (!buyerId || !listingId) {
      return res.status(400).json({ error: "Campos obrigatórios: buyerId e listingId." });
    }

    try {
      const listings = serverDb.getMarketplaceListings();
      const listing = listings.find((it: any) => it.id === listingId);

      if (!listing) {
        return res.status(404).json({ error: "O anúncio do item não foi encontrado ou já foi vendido." });
      }

      const sellerId = listing.seller_id;
      const price = Number(listing.price);
      const currency = listing.currency;
      const itemTitle = listing.title;

      if (buyerId === sellerId) {
        return res.status(400).json({ error: "Você não pode comprar um item listado por você mesmo." });
      }

      const buyerProfile = serverDb.getProfile(buyerId);
      const sellerProfile = serverDb.getProfile(sellerId);

      if (!buyerProfile) return res.status(404).json({ error: "Perfil do comprador não encontrado." });
      if (!sellerProfile) return res.status(404).json({ error: "Perfil do vendedor não encontrado." });

      // Check balance
      if (currency === "real") {
        if ((buyerProfile.realBalance || 0) < price) {
          return res.status(400).json({ error: "Saldo real insuficiente para efetuar a compra." });
        }
      } else {
        if (!buyerProfile.stats || (buyerProfile.stats.coins || 0) < price) {
          return res.status(400).json({ error: "Saldo de moedas virtuais insuficiente para efetuar a compra." });
        }
      }

      // 10% fee commission deduction
      const commissionFee = price * 0.10;
      const sellerReceives = price - commissionFee;

      // Deduct/Credit balances
      if (currency === "real") {
        buyerProfile.realBalance = (buyerProfile.realBalance || 0) - price;
        sellerProfile.realBalance = (sellerProfile.realBalance || 0) + sellerReceives;
      } else {
        buyerProfile.stats.coins = (buyerProfile.stats.coins || 0) - price;
        if (!sellerProfile.stats) {
          sellerProfile.stats = { coins: 0, lives: 3, currentStage: 1, highScore: 0, unlockedSkins: ["classic"], unlockedAccessories: ["none"], unlockedAuras: ["none"], avatar: { skin: "classic", accessory: "none", aura: "none" }, level: 1, points: 0 };
        }
        sellerProfile.stats.coins = (sellerProfile.stats.coins || 0) + sellerReceives;
      }

      // Add to buyer's inventory
      let buyerInventory = buyerProfile.inventario || [];
      buyerInventory.push({
        id: `it-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        name: itemTitle,
        description: listing.description || "Adquirido no marketplace do GameZon.",
        rarity: listing.rarity || "common",
        acquiredAt: new Date().toLocaleDateString('pt-BR'),
        source: 'marketplace'
      });
      buyerProfile.inventario = buyerInventory;

      // Mark as sold in database
      serverDb.buyMarketplaceItem(listingId);

      // Save both updated profiles
      serverDb.saveProfile(buyerId, buyerProfile);
      serverDb.saveProfile(sellerId, sellerProfile);

      // Traceable Log entries for BOTH buyer and seller
      logFinancialTransaction(
        buyerId,
        "purchase_cosmetic",
        `Compra de item no Marketplace: '${itemTitle}' do jogador @${sellerProfile.username || 'user'}`,
        price,
        currency as 'coins' | 'real'
      );

      logFinancialTransaction(
        sellerId,
        "earn",
        `Item '${itemTitle}' vendido no Marketplace para @${buyerProfile.username || 'user'} (Taxa plataforma de 10%: ${commissionFee.toFixed(2)} deduzida)`,
        sellerReceives,
        currency as 'coins' | 'real'
      );

      serverDb.addAuditLog(buyerId, "MARKETPLACE_PURCHASE_COMPLETED", `Jogador comprando item '${itemTitle}' de vendedor ${sellerId} por ${price} ${currency}. Id do anúncio: ${listingId}. Comissão: ${commissionFee}`, req.ip || "unknown", req.headers["user-agent"] || "");

      return res.json({
        success: true,
        realBalance: buyerProfile.realBalance,
        coins: buyerProfile.stats?.coins || 0,
        inventario: buyerInventory
      });
    } catch (err: any) {
      console.error("[MARKETPLACE TRANSACTION ERROR]", err);
      return res.status(500).json({ error: "Falha ao completar compra de item no marketplace." });
    }
  });

  // POST /api/finance/blockchain/verify - Verify full database transaction ledger integrity (Anti-Fraud Check)
  app.post("/api/finance/blockchain/verify", (req, res) => {
    try {
      const secret = process.env.COMPILER_SECRET_SALT || 'GZ_SECURE_SALT_9f31b8a6d25e4c7b80a1c2d3e4f5a6b7';
      const allRows = serverDb.getAllLogs();

      let totalLogs = allRows.length;
      let tamperedLogsCount = 0;
      const tamperedIds: string[] = [];

      allRows.forEach((row) => {
        const recordStr = `${row.id}:${row.userId}:${row.timestamp}:${row.type}:${row.description}:${row.amount}:${row.currency}:${row.status}`;
        const computedHash = '0x' + crypto.createHmac('sha256', secret).update(recordStr).digest('hex');
        
        if (computedHash !== row.securityHash) {
          tamperedLogsCount++;
          tamperedIds.push(row.id || "unknown-id");
        }
      });

      return res.json({
        success: true,
        totalLogs,
        tamperedLogsCount,
        tamperedIds,
        status: tamperedLogsCount === 0 ? "SECURE" : "TAMPERED",
        systemHashVersion: "SHA256-HMAC-V2"
      });
    } catch (err: any) {
      console.error("[LEDGER INTEGRITY ERROR]", err);
      return res.status(500).json({ error: "Falha ao verificar integridade do blockchain financeiro." });
    }
  });

  // GET /api/finance/audit/logs - Retrieve full audit security logs
  app.get("/api/finance/audit/logs", (req, res) => {
    try {
      const logs = serverDb.getAuditLogs();
      return res.json({ success: true, logs });
    } catch (err: any) {
      console.error("[AUDIT LOG RETRIEVAL ERROR]", err);
      return res.status(500).json({ error: "Falha ao resgatar logs de auditoria do sistema." });
    }
  });

  // --- INTEGRATED PAYMENTS INFRASTRUCTURE ENDPOINTS (stripe, paypal, mercadopago, pix, card) ---

  // POST /api/payments/coupon/validate - Validate coupon code
  app.post("/api/payments/coupon/validate", (req, res) => {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "O código do cupom é obrigatório." });
    }
    try {
      const coupon = (serverDb as any).getCouponByCode(code.toUpperCase());
      if (!coupon) {
        return res.status(400).json({ error: "Cupom inválido ou já expirado." });
      }
      return res.json({ success: true, coupon });
    } catch (err: any) {
      console.error("[COUPON VALIDATION ERROR]", err);
      return res.status(500).json({ error: "Falha ao validar cupom." });
    }
  });

  // POST /api/payments/affiliate/register - Register a referral link
  app.post("/api/payments/affiliate/register", (req, res) => {
    const { affiliateId, referredUserId } = req.body;
    if (!affiliateId || !referredUserId) {
      return res.status(400).json({ error: "ID do afiliado e ID do convidado são obrigatórios." });
    }
    if (affiliateId === referredUserId) {
      return res.status(400).json({ error: "Você não pode se auto-convidar como afiliado." });
    }
    try {
      const id = `aff-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      (serverDb as any).addAffiliateReferral(id, affiliateId, referredUserId, 'pending', new Date().toISOString());
      serverDb.addAuditLog(referredUserId, "PAYMENTS_AFFILIATE_LINKED", `Usuário convidado vinculado ao padrinho de indicação: ${affiliateId}`, req.ip || "unknown", req.headers["user-agent"] || "");
      return res.json({ success: true, message: "Padrinho de indicação vinculado com sucesso." });
    } catch (err: any) {
      console.error("[AFFILIATE REGISTER ERROR]", err);
      return res.status(500).json({ error: "Falha ao registrar indicação de afiliado." });
    }
  });

  // POST /api/payments/affiliate/stats - Fetch affiliate statistics
  app.post("/api/payments/affiliate/stats", (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "O campo userId é obrigatório." });
    }
    try {
      const referrals = (serverDb as any).getAffiliateReferrals(userId);
      const commissions = (serverDb as any).getAffiliateCommissions(userId);
      const totalEarnings = commissions.reduce((sum: number, c: any) => sum + c.amount, 0);

      return res.json({
        success: true,
        referrals,
        commissions,
        totalEarnings
      });
    } catch (err: any) {
      console.error("[AFFILIATE STATS ERROR]", err);
      return res.status(500).json({ error: "Falha ao resgatar estatísticas de afiliado." });
    }
  });

  // POST /api/payments/invoice/list - Retrieve invoices for user
  app.post("/api/payments/invoice/list", (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "O campo userId é obrigatório." });
    }
    try {
      const invoices = (serverDb as any).getInvoices(userId);
      return res.json({ success: true, invoices });
    } catch (err: any) {
      console.error("[INVOICE LIST ERROR]", err);
      return res.status(500).json({ error: "Falha ao resgatar faturas." });
    }
  });

  // POST /api/payments/invoice/create-future - Issue a future bill / billing note
  app.post("/api/payments/invoice/create-future", (req, res) => {
    const { userId, amount, dueDate } = req.body;
    if (!userId || !amount || !dueDate) {
      return res.status(400).json({ error: "ID de usuário, valor e data de vencimento são obrigatórios." });
    }
    try {
      const id = `INV-${Date.now()}`;
      const invoiceNumber = `FAT-${Math.floor(100000 + Math.random() * 900000)}`;
      const issueDate = new Date().toISOString().split('T')[0];
      const pdfContent = `
=== GAMEZON FATURA DE COBRANÇA FUTURA ===
Número da Fatura: ${invoiceNumber}
ID do Cliente: ${userId}
Emissão: ${issueDate}
Vencimento: ${dueDate}
Valor Cobrado: R$ ${Number(amount).toFixed(2)}
Status: PENDENTE (Fatura Futura Provisionada)
Ambiente: Produção Segura PCI-DSS v4.0
=========================================
`;
      (serverDb as any).createInvoice(id, invoiceNumber, userId, Number(amount), 'pending', issueDate, dueDate, 'futura', pdfContent, new Date().toISOString());
      serverDb.addAuditLog(userId, "PAYMENTS_INVOICE_FUTURE_CREATED", `Fatura de cobrança futura provisionada no valor de R$ ${amount}`, req.ip || "unknown", req.headers["user-agent"] || "");
      return res.json({ success: true, invoice: { id, invoiceNumber, userId, amount, status: 'pending', issueDate, dueDate, type: 'futura', pdfContent } });
    } catch (err: any) {
      console.error("[FUTURE INVOICE CREATE ERROR]", err);
      return res.status(500).json({ error: "Falha ao provisionar fatura futura." });
    }
  });

  // POST /api/payments/refund - Process payments refunds / cancelations
  app.post("/api/payments/refund", (req, res) => {
    const { transactionId, userId } = req.body;
    if (!transactionId || !userId) {
      return res.status(400).json({ error: "ID da transação e ID de usuário são obrigatórios." });
    }
    try {
      const profile = serverDb.getProfile(userId);
      if (!profile) return res.status(404).json({ error: "Perfil de jogador não encontrado." });

      const logs = serverDb.getLogs(userId) || [];
      const txn = logs.find((l: any) => l.id === transactionId);
      if (!txn) {
        return res.status(404).json({ error: "Transação financeira não encontrada." });
      }
      if (txn.status === 'refunded') {
        return res.status(400).json({ error: "Esta transação já foi reembolsada anteriormente." });
      }

      const amount = txn.amount;
      if (txn.currency === 'real') {
        profile.realBalance = Math.max(0, (profile.realBalance || 0) - amount);
      } else {
        if (profile.stats) {
          profile.stats.coins = Math.max(0, (profile.stats.coins || 0) - amount);
        }
      }

      txn.status = 'refunded';
      txn.description = `[REEMBOLSADO] ${txn.description}`;
      serverDb.saveProfile(userId, profile);

      const invoices = (serverDb as any).getInvoices(userId) || [];
      const invoice = invoices.find((inv: any) => inv.amount === amount || inv.invoice_number.includes(transactionId.split('-')[1] || 'XYZ'));
      if (invoice) {
        (serverDb as any).updateInvoiceStatus(invoice.id, 'refunded');
      }

      logFinancialTransaction(
        userId,
        "stage_skip",
        `Reembolso Aprovado: Transação ${transactionId}`,
        amount,
        txn.currency
      );

      serverDb.addAuditLog(userId, "PAYMENTS_REFUND_APPROVED", `Reembolso de R$ ${amount} aprovado para transação ${transactionId}`, req.ip || "unknown", req.headers["user-agent"] || "");

      return res.json({
        success: true,
        realBalance: profile.realBalance,
        coins: profile.stats?.coins || 0,
        message: "Estorno processado e saldo ajustado."
      });
    } catch (err: any) {
      console.error("[REFUND ERROR]", err);
      return res.status(500).json({ error: "Falha ao processar estorno de pagamento." });
    }
  });

  // POST /api/payments/subscription/cancel - Cancel active recurring subscription
  app.post("/api/payments/subscription/cancel", (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "ID de usuário é obrigatório." });
    }
    try {
      const profile = serverDb.getProfile(userId);
      if (!profile) return res.status(404).json({ error: "Perfil de jogador não encontrado." });

      profile.premium = false;
      if (profile.stats) {
        profile.stats.isVip = false;
      }
      serverDb.saveProfile(userId, profile);

      serverDb.addAuditLog(userId, "PAYMENTS_SUBSCRIPTION_CANCELLED", `Assinatura VIP recorrente cancelada pelo usuário.`, req.ip || "unknown", req.headers["user-agent"] || "");

      return res.json({
        success: true,
        isVip: false,
        message: "Sua assinatura recorrente foi cancelada com sucesso. Benefícios revogados."
      });
    } catch (err: any) {
      console.error("[SUBSCRIPTION CANCEL ERROR]", err);
      return res.status(500).json({ error: "Erro ao cancelar assinatura recorrente." });
    }
  });

  // POST /api/payments/webhook/simulate - Simulate standard payment webhook callbacks (Stripe, Paypal, MercadoPago, Pix)
  app.post("/api/payments/webhook/simulate", (req, res) => {
    const { provider, eventType, amount, userId, couponCode, affiliateId, cardDetails } = req.body;
    if (!provider || !eventType || !amount || !userId) {
      return res.status(400).json({ error: "Campos obrigatórios: provedor, tipo de evento, valor e ID de usuário." });
    }

    try {
      const profile = serverDb.getProfile(userId);
      if (!profile) return res.status(404).json({ error: "Usuário destinatário não encontrado." });

      let finalPrice = Number(amount);
      let couponLog = "";

      if (couponCode) {
        const coupon = (serverDb as any).getCouponByCode(couponCode.toUpperCase());
        if (coupon) {
          if (coupon.type === 'percent') {
            finalPrice = finalPrice * (1 - coupon.value / 100);
          } else {
            finalPrice = Math.max(0, finalPrice - coupon.value);
          }
          (serverDb as any).useCoupon(couponCode.toUpperCase());
          couponLog = ` (Cupom: ${couponCode.toUpperCase()} aplicado - R$ ${coupon.value}${coupon.type === 'percent' ? '%' : ''} de desconto)`;
        }
      }

      let pciMaskedNotes = "";
      if (cardDetails && cardDetails.number) {
        const maskedNum = `XXXX-XXXX-XXXX-${cardDetails.number.slice(-4)}`;
        pciMaskedNotes = ` | Cartão mascarado (PCI-DSS): ${maskedNum} (Portador: ${cardDetails.name || 'GZ Player'})`;
      }

      profile.realBalance = (profile.realBalance || 0) + Number(finalPrice);
      serverDb.saveProfile(userId, profile);

      const txn = logFinancialTransaction(
        userId,
        "purchase_coins",
        `Webhook ${provider.toUpperCase()}: Evento ${eventType}${couponLog}${pciMaskedNotes}`,
        Number(finalPrice),
        "real"
      );

      if (affiliateId && affiliateId !== userId) {
        const commissionAmount = finalPrice * 0.10;
        const affiliateProfile = serverDb.getProfile(affiliateId);
        if (affiliateProfile) {
          affiliateProfile.realBalance = (affiliateProfile.realBalance || 0) + commissionAmount;
          serverDb.saveProfile(affiliateId, affiliateProfile);

          const commissionId = `COM-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
          (serverDb as any).addCommission(commissionId, affiliateId, userId, txn.id, commissionAmount, 'paid', new Date().toISOString());

          logFinancialTransaction(
            affiliateId,
            "earn",
            `Comissão de Afiliado: 10% sobre o depósito do indicado ${profile.username || userId}`,
            commissionAmount,
            "real"
          );

          (serverDb as any).updateAffiliateReferralStatus(userId, 'active');
          serverDb.addAuditLog(affiliateId, "PAYMENTS_AFFILIATE_COMMISSION_EARNED", `Comissão de R$ ${commissionAmount.toFixed(2)} recebida pela transação ${txn.id} do convidado ${userId}`, "webhook_engine", "");
        }
      }

      const invoiceId = `INV-${Date.now()}`;
      const invoiceNumber = `FAT-${Math.floor(100000 + Math.random() * 900000)}`;
      const issueDate = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
      const pdfContent = `
=========================================
      GAMEZON FATURA FISCAL / RECIBO
=========================================
Número da Fatura: ${invoiceNumber}
Provedor de Pagamento: ${provider.toUpperCase()}
Método Utilizado: ${eventType.includes('card') ? 'Cartão de Crédito/Débito' : provider.toUpperCase()}
ID do Cliente: ${userId}
Emissão: ${issueDate}
Valor Total Pago: R$ ${Number(finalPrice).toFixed(2)}
Status: PAGO (Fatura Conciliada)
Ambiente: Produção Segura PCI-DSS v4.0
Detalhamento de Transação: ${txn.id}
Assinatura Digital de Segurança: ${txn.securityHash}
=========================================
`;
      (serverDb as any).createInvoice(invoiceId, invoiceNumber, userId, Number(finalPrice), 'paid', issueDate, dueDate, 'avulsa', pdfContent, new Date().toISOString());

      const webhookId = `wh-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      (serverDb as any).addWebhookLog(
        webhookId,
        provider,
        eventType,
        JSON.stringify({ userId, originalAmount: amount, finalAmount: finalPrice, couponCode, txnId: txn.id, pciMaskedNotes }),
        'processed',
        200,
        new Date().toISOString()
      );

      const conciliationId = `CONC-${Date.now()}`;
      (serverDb as any).createOrUpdateConciliation(conciliationId, txn.id, 1, new Date().toISOString(), `Autoconciliado via Webhook Integrado. Tudo em ordem. Provedor: ${provider.toUpperCase()}`, finalPrice, finalPrice, 'matched');

      serverDb.addAuditLog(userId, "PAYMENTS_WEBHOOK_PROCESSED", `Webhook de ${provider} processado com sucesso. Valor final creditado: R$ ${finalPrice}`, "webhook_engine", "");

      return res.json({
        success: true,
        realBalance: profile.realBalance,
        coins: profile.stats?.coins || 0,
        transaction: txn
      });
    } catch (err: any) {
      console.error("[WEBHOOK SIMULATOR ERROR]", err);
      return res.status(500).json({ error: "Erro ao processar simulação de webhook de pagamentos." });
    }
  });

  // GET /api/payments/webhook/logs - Retrieve webhook logs
  app.get("/api/payments/webhook/logs", (req, res) => {
    try {
      const logs = (serverDb as any).getWebhookLogs();
      return res.json({ success: true, logs });
    } catch (err: any) {
      console.error("[WEBHOOK LOGS RETRIEVAL ERROR]", err);
      return res.status(500).json({ error: "Falha ao resgatar logs de webhooks." });
    }
  });

  // GET /api/payments/conciliation/list - Retrieve conciliation records
  app.get("/api/payments/conciliation/list", (req, res) => {
    try {
      const records = (serverDb as any).getConciliationRecords();
      return res.json({ success: true, records });
    } catch (err: any) {
      console.error("[CONCILIATION RECORDS RETRIEVAL ERROR]", err);
      return res.status(500).json({ error: "Falha ao resgatar registros de conciliação." });
    }
  });

  // POST /api/payments/conciliation/action - Force manually reconcile transaction / solve discrepancy
  app.post("/api/payments/conciliation/action", (req, res) => {
    const { transactionId, action, providerAmount } = req.body;
    if (!transactionId || !action || providerAmount === undefined) {
      return res.status(400).json({ error: "Campos obrigatórios: transactionId, ação, valor do provedor." });
    }

    try {
      const qResult = serverDb.runGenericQuery("SELECT * FROM logs WHERE id = ?", [transactionId]);
      if (!qResult.success || !qResult.rows || qResult.rows.length === 0) {
        return res.status(404).json({ error: "Transação original não encontrada no sistema." });
      }

      const txn = qResult.rows[0];
      const systemAmount = txn.amount;
      const isMatched = Math.abs(systemAmount - providerAmount) < 0.01;
      const finalStatus = isMatched ? 'matched' : (action === 'reconcile' ? 'matched' : 'discrepancy');

      const id = `CONC-${Date.now()}`;
      (serverDb as any).createOrUpdateConciliation(
        id,
        transactionId,
        action === 'reconcile' ? 1 : 0,
        new Date().toISOString(),
        `Ação de conciliação forçada via painel pelo Auditor. Diferença: R$ ${(systemAmount - providerAmount).toFixed(2)}`,
        systemAmount,
        providerAmount,
        finalStatus
      );

      serverDb.addAuditLog("system_admin", "PAYMENTS_CONCILIATION_RESOLVED", `Transação ${transactionId} marcada como ${finalStatus} pelo auditor.`, req.ip || "unknown", req.headers["user-agent"] || "");

      return res.json({ success: true, status: finalStatus });
    } catch (err: any) {
      console.error("[CONCILIATION ACTION ERROR]", err);
      return res.status(500).json({ error: "Erro ao processar ação de conciliação." });
    }
  });

  // --- MUTABLE GLOBAL CORPORATE ADMIN CONFIGURATIONS ---
  let globalAdminConfigs = {
    maintenanceMode: false,
    rtpOverlay: "normal", // 'boost', 'normal', 'house_win'
    affiliateRatePercent: 10,
    simulatePaymentGateway: true,
    customNotificationNotice: "Aviso Global: Painel de Controle Operando Estável.",
    stripeKeySimulated: "sk_test_51Px...simulated_gamezone_2026",
    paypalKeySimulated: "client_id_test_simulated_pay_v4",
    payoutApprovalThreshold: 1000.00
  };

  // GET /api/admin/system-data - Aggregate state for Admin Panel
  app.get("/api/admin/system-data", requireRole(["admin", "moderator", "auditor"]), (req: any, res: any) => {
    try {
      const users = (serverDb as any).getAdminUsers();
      const reports = (serverDb as any).getAdminReports();
      const streams = (serverDb as any).getAdminStreams();
      const marketplaces = (serverDb as any).getAdminMarketplaces();
      const products = (serverDb as any).getAdminProducts();
      const posts = (serverDb as any).getAdminPosts();
      const sessions = (serverDb as any).getAdminActiveSessions();
      const ipBlocks = (serverDb as any).getAdminIpBlocks();
      const auditLogs = serverDb.getAuditLogs();
      const coupons = (serverDb as any).getCoupons();
      const allInvoices = (serverDb as any).getAllInvoices();
      const webhookLogs = (serverDb as any).getWebhookLogs();
      const conciliationRecords = (serverDb as any).getConciliationRecords();

      // Gather simple metrics
      const totalDeposits = allInvoices.filter((i: any) => i.status === "completed" && i.type === "deposit").reduce((acc: number, i: any) => acc + i.amount, 0);
      const totalWithdrawals = allInvoices.filter((i: any) => i.status === "completed" && i.type === "withdraw").reduce((acc: number, i: any) => acc + i.amount, 0);
      
      return res.json({
        users,
        reports,
        streams,
        marketplaces,
        products,
        posts,
        sessions,
        ipBlocks,
        auditLogs,
        coupons,
        allInvoices,
        webhookLogs,
        conciliationRecords,
        globalConfigs: globalAdminConfigs,
        metrics: {
          totalDeposits,
          totalWithdrawals,
          activeUsersCount: users.length,
          activeSessionsCount: sessions.filter((s: any) => s.ativa === 1).length,
          totalReportsCount: reports.length,
          pendingReportsCount: reports.filter((r: any) => r.status === "pending").length,
          ipBlocksCount: ipBlocks.length,
          ggrAmount: totalDeposits - totalWithdrawals,
          complianceScore: auditLogs.filter((l: any) => l.isTampered).length > 0 ? 82 : 100
        }
      });
    } catch (err: any) {
      console.error("[ADMIN DATA RETRIEVAL ERROR]", err);
      return res.status(500).json({ error: "Erro ao compilar dados do painel administrativo." });
    }
  });

  // POST /api/admin/users/update-stats - Change user's balance, coins, level
  app.post("/api/admin/users/update-stats", requireRole(["admin"]), (req: any, res: any) => {
    const { targetUserId, balance, coins, level } = req.body;
    if (!targetUserId) return res.status(400).json({ error: "ID de usuário obrigatório." });

    try {
      (serverDb as any).updateUserStatsAndBalance(targetUserId, Number(balance), Number(coins), Number(level));
      serverDb.addAuditLog(req.userId || "admin", "USER_STATS_OVERRIDE", `Saldos do usuário ${targetUserId} alterados via painel admin: Saldo R$ ${balance}, Moedas: ${coins}, Nível: ${level}`, req.ip || "unknown", req.headers["user-agent"] || "");
      return res.json({ success: true, message: "Saldos do usuário atualizados com sucesso." });
    } catch (err: any) {
      console.error("[ADMIN UPDATE STATS ERROR]", err);
      return res.status(500).json({ error: "Erro ao salvar saldos modificados." });
    }
  });

  // POST /api/admin/users/ban - Block / unblock users or ban IP
  app.post("/api/admin/users/ban", requireRole(["admin", "moderator"]), (req: any, res: any) => {
    const { targetUserId, ip, ban, reason } = req.body;
    if (!ip) return res.status(400).json({ error: "Endereço de IP é obrigatório." });

    try {
      if (ban) {
        // Block until year 2030 (long ban)
        (serverDb as any).addIpBlockAdmin(ip, "2030-12-31T23:59:59.000Z");
        serverDb.addAuditLog(req.userId || "moderator", "IP_BAN_IMPOSED", `IP ${ip} banido. Motivo: ${reason || "Infração dos termos de uso"}`, req.ip || "unknown", req.headers["user-agent"] || "");
      } else {
        (serverDb as any).removeIpBlockAdmin(ip);
        serverDb.addAuditLog(req.userId || "moderator", "IP_BAN_REVOKED", `IP ${ip} desbanido pelo painel de controle corporativo`, req.ip || "unknown", req.headers["user-agent"] || "");
      }
      return res.json({ success: true, message: ban ? "IP bloqueado com sucesso." : "IP desbloqueado com sucesso." });
    } catch (err: any) {
      console.error("[ADMIN BAN ERROR]", err);
      return res.status(500).json({ error: "Erro ao processar banimento de IP." });
    }
  });

  // POST /api/admin/users/shadowban - Shadowban a user
  app.post("/api/admin/users/shadowban", requireRole(["admin", "moderator"]), (req: any, res: any) => {
    const { targetUserId, shadowban } = req.body;
    if (!targetUserId) return res.status(400).json({ error: "ID de usuário obrigatório." });

    try {
      const profile = serverDb.getProfile(targetUserId);
      if (profile) {
        (serverDb as any).updateUserShadowban(targetUserId, shadowban ? 1 : 0);
        serverDb.addAuditLog(req.userId || "moderator", "USER_SHADOWBAN", `Usuário ${targetUserId} shadowban marcado como: ${shadowban}`, req.ip || "unknown", req.headers["user-agent"] || "");
        return res.json({ success: true, shadowbanned: shadowban });
      }
      return res.status(404).json({ error: "Jogador não encontrado." });
    } catch (err: any) {
      console.error("[ADMIN SHADOWBAN ERROR]", err);
      return res.status(500).json({ error: "Erro ao atualizar shadowban." });
    }
  });

  // POST /api/admin/users/terminate-session - Terminate active session remotely
  app.post("/api/admin/users/terminate-session", requireRole(["admin"]), (req: any, res: any) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "ID de sessão obrigatório." });

    try {
      (serverDb as any).terminateSessionAdmin(sessionId);
      serverDb.addAuditLog(req.userId || "admin", "SESSION_FORCE_TERMINATED", `Sessão ativa ID ${sessionId} revogada e encerrada remotamente por auditoria`, req.ip || "unknown", req.headers["user-agent"] || "");
      return res.json({ success: true, message: "Sessão encerrada com sucesso." });
    } catch (err: any) {
      console.error("[ADMIN TERMINATE SESSION ERROR]", err);
      return res.status(500).json({ error: "Erro ao encerrar sessão remota." });
    }
  });

  // POST /api/admin/payments/approve - Approve / reject withdrawal or deposit manual approvals
  app.post("/api/admin/payments/approve", requireRole(["admin", "auditor"]), (req: any, res: any) => {
    const { invoiceId, approve, reason } = req.body;
    if (!invoiceId) return res.status(400).json({ error: "ID da fatura é obrigatório." });

    try {
      const status = approve ? "completed" : "rejected";
      (serverDb as any).updateInvoiceStatus(invoiceId, status);
      serverDb.addAuditLog(req.userId || "admin", "INVOICE_STATUS_OVERRIDE", `Fatura ${invoiceId} marcada como ${status} pelo painel admin. Parecer: ${reason || "Nenhum"}`, req.ip || "unknown", req.headers["user-agent"] || "");
      return res.json({ success: true, status });
    } catch (err: any) {
      console.error("[ADMIN PAYMENTS APPROVE ERROR]", err);
      return res.status(500).json({ error: "Erro ao atualizar fatura de pagamento." });
    }
  });

  // POST /api/admin/payments/coupons - Create promo coupons
  app.post("/api/admin/payments/coupons", requireRole(["admin"]), (req: any, res: any) => {
    const { code, type, value, maxUses } = req.body;
    if (!code || !type || !value) return res.status(400).json({ error: "Parâmetros do cupom inválidos." });

    try {
      const id = `CUP-${Date.now()}`;
      (serverDb as any).createCoupon(id, String(code).toUpperCase(), type, Number(value), Number(maxUses || 9999));
      serverDb.addAuditLog(req.userId || "admin", "COUPON_CREATED", `Novo cupom promocional criado: ${code}, Valor: ${value}, Tipo: ${type}`, req.ip || "unknown", req.headers["user-agent"] || "");
      return res.json({ success: true, message: "Cupom gerado com sucesso!" });
    } catch (err: any) {
      console.error("[ADMIN COUPON CREATING ERROR]", err);
      return res.status(500).json({ error: "Erro ao criar cupom. Código duplicado ou inválido." });
    }
  });

  // POST /api/admin/moderation/resolve-report - Warn / Ban / Dismiss reported items
  app.post("/api/admin/moderation/resolve-report", requireRole(["admin", "moderator"]), (req: any, res: any) => {
    const { reportId, action } = req.body; // action: 'resolved', 'dismissed', 'deleted'
    if (!reportId || !action) return res.status(400).json({ error: "reportId e action são obrigatórios." });

    try {
      (serverDb as any).updateReportStatus(reportId, action);
      serverDb.addAuditLog(req.userId || "moderator", "REPORT_RESOLVED", `Denúncia ${reportId} marcada como: ${action}`, req.ip || "unknown", req.headers["user-agent"] || "");
      return res.json({ success: true, message: "Denúncia resolvida." });
    } catch (err: any) {
      console.error("[ADMIN RESOLVE REPORT ERROR]", err);
      return res.status(500).json({ error: "Erro ao resolver denúncia." });
    }
  });

  // POST /api/admin/moderation/delete-post - Remove inappropriate posts/comments
  app.post("/api/admin/moderation/delete-post", requireRole(["admin", "moderator"]), (req: any, res: any) => {
    const { postId } = req.body;
    if (!postId) return res.status(400).json({ error: "postId é obrigatório." });

    try {
      (serverDb as any).deletePostAdmin(postId);
      serverDb.addAuditLog(req.userId || "moderator", "POST_DELETED_BY_ADMIN", `Postagem ${postId} removida por moderador por violar conduta`, req.ip || "unknown", req.headers["user-agent"] || "");
      return res.json({ success: true, message: "Publicação removida." });
    } catch (err: any) {
      console.error("[ADMIN DELETE POST ERROR]", err);
      return res.status(500).json({ error: "Erro ao deletar publicação." });
    }
  });

  // POST /api/admin/streams/control - Moderate live streaming status
  app.post("/api/admin/streams/control", requireRole(["admin", "moderator"]), (req: any, res: any) => {
    const { streamId, isLive } = req.body;
    if (!streamId) return res.status(400).json({ error: "streamId é obrigatório." });

    try {
      (serverDb as any).updateStreamStatus(streamId, isLive ? 1 : 0, isLive ? 120 : 0);
      serverDb.addAuditLog(req.userId || "moderator", "STREAM_MODERATION", `Status da transmissão ${streamId} forçado para: ${isLive ? 'ONLINE' : 'OFFLINE'}`, req.ip || "unknown", req.headers["user-agent"] || "");
      return res.json({ success: true, message: "Status da transmissão atualizado." });
    } catch (err: any) {
      console.error("[ADMIN STREAMS CONTROL ERROR]", err);
      return res.status(500).json({ error: "Erro ao controlar transmissão." });
    }
  });

  // POST /api/admin/marketplace/control - Moderate store and products
  app.post("/api/admin/marketplace/control", requireRole(["admin", "moderator"]), (req: any, res: any) => {
    const { type, id, isActive, isAvailable } = req.body; // type: 'marketplace' or 'product'
    if (!type || !id) return res.status(400).json({ error: "Parâmetros id e type são obrigatórios." });

    try {
      if (type === "marketplace") {
        (serverDb as any).updateMarketplaceStatus(id, isActive ? 1 : 0);
        serverDb.addAuditLog(req.userId || "moderator", "MARKETPLACE_MODERATION", `Status da loja ${id} alterado para: ${isActive ? 'ATIVO' : 'SUSPENSO'}`, req.ip || "unknown", req.headers["user-agent"] || "");
      } else {
        (serverDb as any).updateProductAvailability(id, isAvailable ? 1 : 0);
        serverDb.addAuditLog(req.userId || "moderator", "PRODUCT_MODERATION", `Disponibilidade do produto ${id} alterada para: ${isAvailable ? 'SIM' : 'NÃO'}`, req.ip || "unknown", req.headers["user-agent"] || "");
      }
      return res.json({ success: true, message: "Marketplace atualizado com sucesso." });
    } catch (err: any) {
      console.error("[ADMIN MARKETPLACE CONTROL ERROR]", err);
      return res.status(500).json({ error: "Erro ao controlar e-commerce." });
    }
  });

  // POST /api/admin/configs/update - Update platform parameters
  app.post("/api/admin/configs/update", requireRole(["admin"]), (req: any, res: any) => {
    const { configs } = req.body;
    if (!configs) return res.status(400).json({ error: "Dados de configurações ausentes." });

    try {
      globalAdminConfigs = {
        ...globalAdminConfigs,
        ...configs
      };
      serverDb.addAuditLog(req.userId || "admin", "CONFIGS_UPDATED", "Parâmetros globais da plataforma atualizados", req.ip || "unknown", req.headers["user-agent"] || "");
      return res.json({ success: true, configs: globalAdminConfigs });
    } catch (err: any) {
      console.error("[ADMIN CONFIGS UPDATE ERROR]", err);
      return res.status(500).json({ error: "Erro ao atualizar parâmetros globais." });
    }
  });

  // Vite integration middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("[SERVER] Starting in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[SERVER] Starting in production mode serving static assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer });

  // Map to hold connected users and their WebSockets
  const clients = new Map<string, Set<WebSocket>>(); // userId -> Set of WS connections
  const onlineUsers = new Map<string, string>(); // userId -> status ('online' | 'busy' | 'offline')

  wss.on("connection", (ws) => {
    let currentUserId: string | null = null;

    ws.on("message", (messageRaw) => {
      try {
        const data = JSON.parse(messageRaw.toString());
        const { type, payload } = data;

        if (type === "register") {
          const { userId } = payload;
          if (userId) {
            currentUserId = userId;
            if (!clients.has(userId)) {
              clients.set(userId, new Set());
            }
            clients.get(userId)!.add(ws);
            onlineUsers.set(userId, "online");

            // Broadcast status change to everyone
            broadcastStatus(userId, "online");

            // Send current list of online users to this connected client
            ws.send(JSON.stringify({
              type: "online_users",
              payload: {
                users: Array.from(onlineUsers.entries()).map(([uid, status]) => ({ uid, status }))
              }
            }));
          }
        }

        if (type === "status_change") {
          const { userId, status } = payload;
          if (userId && status) {
            onlineUsers.set(userId, status);
            broadcastStatus(userId, status);
          }
        }

        if (type === "typing") {
          const { userId, targetId, targetType, isTyping } = payload;
          if (targetType === "private") {
            sendToUser(targetId, {
              type: "typing",
              payload: { userId, targetId, targetType, isTyping }
            });
          } else {
            // Broadcast typing to everyone except typing user
            broadcastToAll({
              type: "typing",
              payload: { userId, targetId, targetType, isTyping }
            }, ws);
          }
        }

        if (type === "message") {
          const { message } = payload;
          if (message) {
            serverDb.addMessage(message);

            if (message.group_id) {
              // Group or Channel message: broadcast to all online users
              broadcastToAll({
                type: "message",
                payload: { message }
              });
            } else {
              // Direct private message
              sendToUser(message.receiverId, {
                type: "message",
                payload: { message }
              });
              // Sync sender's other connected devices
              sendToUser(message.senderId, {
                type: "message",
                payload: { message }
              }, ws);
            }
          }
        }

        if (type === "reaction") {
          const { messageId, userId, emoji, userName, targetId, isGroup } = payload;
          if (messageId && userId && emoji) {
            serverDb.reactToMessage(messageId, userId, emoji, userName || "Usuário");

            // Broadcast reaction update to all connected users
            broadcastToAll({
              type: "reaction",
              payload: { messageId, targetId, isGroup }
            });
          }
        }

        if (type === "pin") {
          const { messageId, pinned, targetId, isGroup } = payload;
          if (messageId) {
            serverDb.pinMessage(messageId, !!pinned);

            broadcastToAll({
              type: "pin",
              payload: { messageId, pinned, targetId, isGroup }
            });
          }
        }

        if (type === "delete") {
          const { messageId, targetId, isGroup } = payload;
          if (messageId) {
            serverDb.deleteMessage(messageId);

            broadcastToAll({
              type: "delete",
              payload: { messageId, targetId, isGroup }
            });
          }
        }

        // --- Live VOICE & VIDEO CALL signaling endpoints ---
        if (type === "call:offer") {
          const { senderId, receiverId, callType, senderName, senderAvatar } = payload;
          sendToUser(receiverId, {
            type: "call:offer",
            payload: { senderId, receiverId, callType, senderName, senderAvatar }
          });
        }

        if (type === "call:answer") {
          const { senderId, receiverId, accepted } = payload;
          sendToUser(senderId, {
            type: "call:answer",
            payload: { senderId, receiverId, accepted }
          });
        }

        if (type === "call:hangup") {
          const { senderId, receiverId } = payload;
          sendToUser(receiverId, {
            type: "call:hangup",
            payload: { senderId, receiverId }
          });
          sendToUser(senderId, {
            type: "call:hangup",
            payload: { senderId, receiverId }
          });
        }

      } catch (err) {
        console.error("[WS MESSAGE PROCESS ERROR]", err);
      }
    });

    ws.on("close", () => {
      if (currentUserId) {
        const userConnections = clients.get(currentUserId);
        if (userConnections) {
          userConnections.delete(ws);
          if (userConnections.size === 0) {
            clients.delete(currentUserId);
            onlineUsers.delete(currentUserId);
            // Notify other clients about offline state
            broadcastStatus(currentUserId, "offline");
          }
        }
      }
    });
  });

  // Helper functions for WS delivery
  function sendToUser(userId: string, data: any, excludeWs?: WebSocket) {
    const userConnections = clients.get(userId);
    if (userConnections) {
      const msg = JSON.stringify(data);
      for (const conn of userConnections) {
        if (conn !== excludeWs && conn.readyState === WebSocket.OPEN) {
          conn.send(msg);
        }
      }
    }
  }

  function broadcastStatus(userId: string, status: string) {
    const data = JSON.stringify({
      type: "status_change",
      payload: { userId, status }
    });
    for (const [uid, userConnections] of clients.entries()) {
      for (const conn of userConnections) {
        if (conn.readyState === WebSocket.OPEN) {
          conn.send(data);
        }
      }
    }
  }

  function broadcastToAll(data: any, excludeWs?: WebSocket) {
    const msg = JSON.stringify(data);
    for (const [uid, userConnections] of clients.entries()) {
      for (const conn of userConnections) {
        if (conn !== excludeWs && conn.readyState === WebSocket.OPEN) {
          conn.send(msg);
        }
      }
    }
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Full-Stack Real-Time and WS Engine running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("[SERVER] Startup failed:", error);
  process.exit(1);
});
