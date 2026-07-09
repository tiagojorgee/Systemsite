import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { serverDb } from "./serverDb";

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
    const fileExt = path.extname(file.originalname) || ".png";
    const uniqueName = `feed-${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // Limit to 50MB
});

// Helper to save base64 data to local file in uploads folder
function saveBase64ToUploads(base64Data: string, fileName: string): string | null {
  try {
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
    let buffer: Buffer;
    let extension = ".png";

    if (matches && matches.length === 3) {
      const mime = matches[1];
      buffer = Buffer.from(matches[2], "base64");
      const parts = mime.split("/");
      if (parts.length === 2) {
        extension = "." + parts[1];
      }
    } else {
      buffer = Buffer.from(base64Data, "base64");
      const detectedExt = path.extname(fileName);
      if (detectedExt) extension = detectedExt;
    }

    const uniqueName = `upload-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    const filePath = path.join(process.cwd(), "uploads", uniqueName);
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

  // Serve uploads folder as static
  app.use("/uploads", express.static(uploadsDir));

  // JSON and URL-encoded body parsers with generous limits for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API health route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // --- AUTH ENDPOINTS ---

  // GET /api/auth/me - Verify current session token
  app.get("/api/auth/me", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Sessão expirada ou não autenticada." });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = serverDb.getUser(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado." });
      }

      return res.json({
        user: {
          email: user.email,
          name: user.name,
          provider: "email",
          uid: user.uid,
          avatarUrl: user.avatarUrl
        }
      });
    } catch (err) {
      return res.status(401).json({ error: "Sessão inválida ou expirada." });
    }
  });

  // POST /api/auth/register
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "E-mail, senha e nome são obrigatórios." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userId = "user_" + cleanEmail.replace(/[^a-zA-Z0-9_\-]/g, "_");

    try {
      const existingUser = serverDb.getUser(userId);
      if (existingUser) {
        return res.status(400).json({ error: "Este e-mail já está cadastrado no sistema." });
      }

      // Cryptography of Password via bcrypt
      const saltRounds = 10;
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
      console.log(`[AUTH] User registered successfully in SQLite: ${cleanEmail}`);

      // Sign JWT
      const token = jwt.sign({ userId, email: cleanEmail, name }, JWT_SECRET, { expiresIn: "7d" });

      return res.json({
        token,
        user: {
          email: newUser.email,
          name: newUser.name,
          provider: newUser.provider,
          uid: newUser.uid,
          avatarUrl: newUser.avatarUrl
        }
      });
    } catch (err: any) {
      console.error("[AUTH REGISTRATION ERROR]", err);
      return res.status(500).json({ error: "Erro interno ao processar cadastro." });
    }
  });

  // POST /api/auth/login
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userId = "user_" + cleanEmail.replace(/[^a-zA-Z0-9_\-]/g, "_");

    try {
      const user = serverDb.getUser(userId);
      if (!user || !user.password) {
        return res.status(400).json({ error: "E-mail ou senha incorretos." });
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "E-mail ou senha incorretos." });
      }

      console.log(`[AUTH] User logged in SQLite: ${cleanEmail}`);

      // Sign JWT
      const token = jwt.sign({ userId, email: cleanEmail, name: user.name }, JWT_SECRET, { expiresIn: "7d" });

      return res.json({
        token,
        user: {
          email: user.email,
          name: user.name,
          provider: user.provider,
          uid: user.uid || userId,
          avatarUrl: user.avatarUrl
        }
      });
    } catch (err: any) {
      console.error("[AUTH LOGIN ERROR]", err);
      return res.status(500).json({ error: "Erro interno ao processar login." });
    }
  });

  // POST /api/auth/google-login (Allows compatible Google SSO using direct JWT fallback)
  app.post("/api/auth/google-login", (req, res) => {
    const { email, name, avatarUrl, uid } = req.body;
    if (!email) {
      return res.status(400).json({ error: "E-mail do Google é obrigatório." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userId = uid || "user_" + cleanEmail.replace(/[^a-zA-Z0-9_\-]/g, "_");

    try {
      const updatedUser = {
        email: cleanEmail,
        name: name || "Usuário Google",
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name || "google")}`,
        provider: "google" as const,
        uid: userId
      };

      serverDb.saveUser(userId, updatedUser);
      console.log(`[AUTH] Google user upserted: ${cleanEmail}`);

      // Sign JWT
      const token = jwt.sign({ userId, email: cleanEmail, name: updatedUser.name }, JWT_SECRET, { expiresIn: "7d" });

      return res.json({
        token,
        user: {
          email: updatedUser.email,
          name: updatedUser.name,
          provider: updatedUser.provider,
          uid: updatedUser.uid,
          avatarUrl: updatedUser.avatarUrl
        }
      });
    } catch (err: any) {
      console.error("[AUTH GOOGLE LOGIN ERROR]", err);
      return res.status(500).json({ error: "Erro interno no Google login." });
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

  // GET /api/feed - Fetch all posts in chronological (descending) order
  app.get("/api/feed", async (req, res) => {
    try {
      const posts = serverDb.getPosts();
      return res.json({ posts, source: "sqlite" });
    } catch (err: any) {
      console.error("[FEED FETCH ERROR]", err);
      return res.status(500).json({ error: "Erro ao buscar publicações do banco de dados." });
    }
  });

  // POST /api/feed - Create a post with local image upload handling
  app.post("/api/feed", upload.single("media"), async (req, res) => {
    const { username, userAvatarUrl, text, mediaBase64, mediaFileName, mediaUrl, mediaType, userId } = req.body;

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
      comments: []
    };

    try {
      serverDb.addPost(newPost);
      return res.json({ post: newPost, source: "sqlite" });
    } catch (err: any) {
      console.error("[FEED POST CREATION ERROR]", err);
      return res.status(500).json({ error: "Erro ao criar nova publicação no SQLite." });
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
          avatarGallery: p?.avatarGallery || []
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

  // GET /api/user/notifications - Fetch new messages, followers, and active store promotions
  app.get("/api/user/notifications", (req, res) => {
    const { userId, lastChecked } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "O campo userId é obrigatório." });
    }

    try {
      let newMessages: any[] = [];
      if (lastChecked) {
        newMessages = serverDb.getNewMessagesForReceiver(userId as string, lastChecked as string);
      }

      // Check current followers from profile
      const profile = serverDb.getProfile(userId as string);
      const followers = profile?.followers || [];

      // Dynamic store promotions
      const promos = [
        { id: "promo-vip-1", title: "👑 Bônus VIP Ativo na Loja!", body: "Adquira moedas ou vidas com 15% de cashback na carteira agora!" },
        { id: "promo-skin-2", title: "🎨 Novidades no Customizador de Piloto!", body: "Novos trajes e auras brilhantes foram adicionados para customização." },
        { id: "promo-football-3", title: "⚽ Rodada de Palpites Liberada!", body: "Dobre suas moedas palpitando nos clássicos de futebol desta semana!" },
        { id: "promo-cinema-4", title: "🍿 Cine Lounge tem novos trailers!", body: "Venha assistir aos lançamentos e interagir no chat coletivo do lounge!" }
      ];
      
      const currentMinute = new Date().getMinutes();
      const promotion = promos[currentMinute % promos.length];

      return res.json({
        success: true,
        newMessages,
        followers,
        promotion
      });
    } catch (err: any) {
      console.error("[GET NOTIFICATIONS ERROR]", err);
      return res.status(500).json({ error: "Erro ao buscar notificações." });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Running successfully at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("[SERVER] Startup failed:", error);
  process.exit(1);
});
