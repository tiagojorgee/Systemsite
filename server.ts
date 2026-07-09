import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import { serverDb } from "./serverDb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase client lazy getter
function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}

// Supabase Storage file upload helper
async function uploadToSupabaseStorage(supabase: any, base64Data: string, fileName: string): Promise<string | null> {
  try {
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
    let buffer: Buffer;
    let contentType = 'application/octet-stream';
    
    if (matches && matches.length === 3) {
      contentType = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(base64Data, 'base64');
    }

    const fileExt = fileName.split('.').pop() || 'bin';
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filepath = `uploads/${uniqueFileName}`;

    const { data, error } = await supabase.storage
      .from('arquivos-usuarios')
      .upload(filepath, buffer, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error("[SUPABASE STORAGE ERROR] Failed to upload. Trying to get fallback or auto-recovering:", error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('arquivos-usuarios')
      .getPublicUrl(filepath);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("[SUPABASE STORAGE EXCEPTION]", err);
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  // JSON and URL-encoded body parsers with generous limits for file uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API health route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // --- AUTH ENDPOINTS ---

  // POST /api/auth/register
  app.post("/api/auth/register", (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "E-mail, senha e nome são obrigatórios." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userId = 'user_' + cleanEmail.replace(/[^a-zA-Z0-9_\-]/g, '_');

    const existingUser = serverDb.getUser(userId);
    if (existingUser) {
      return res.status(400).json({ error: "Este e-mail já está cadastrado no sistema." });
    }

    const newUser = {
      email: cleanEmail,
      password,
      name,
      provider: 'email' as const,
      uid: userId
    };

    serverDb.saveUser(userId, newUser);
    console.log(`[AUTH] User registered successfully: ${cleanEmail}`);
    return res.json({ user: { email: newUser.email, name: newUser.name, provider: newUser.provider, uid: newUser.uid } });
  });

  // POST /api/auth/login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userId = 'user_' + cleanEmail.replace(/[^a-zA-Z0-9_\-]/g, '_');

    const user = serverDb.getUser(userId);
    if (!user || user.password !== password) {
      return res.status(400).json({ error: "E-mail ou senha incorretos." });
    }

    console.log(`[AUTH] User logged in: ${cleanEmail}`);
    return res.json({ user: { email: user.email, name: user.name, provider: user.provider, uid: user.uid || userId } });
  });

  // POST /api/auth/google-login
  app.post("/api/auth/google-login", (req, res) => {
    const { email, name, avatarUrl, uid } = req.body;
    if (!email) {
      return res.status(400).json({ error: "E-mail do Google é obrigatório." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userId = uid || 'user_' + cleanEmail.replace(/[^a-zA-Z0-9_\-]/g, '_');

    const existingUser = serverDb.getUser(userId);
    const updatedUser = {
      email: cleanEmail,
      name: name || "Usuário Google",
      avatarUrl,
      provider: 'google' as const,
      uid: userId
    };

    serverDb.saveUser(userId, updatedUser);
    console.log(`[AUTH] Google user upserted: ${cleanEmail}`);
    return res.json({ user: { email: updatedUser.email, name: updatedUser.name, provider: updatedUser.provider, uid: updatedUser.uid, avatarUrl: updatedUser.avatarUrl } });
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
      unlockedSkins: ['classic'],
      unlockedAccessories: ['none'],
      unlockedAuras: ['none'],
      avatar: { skin: 'classic', accessory: 'none', aura: 'none' },
      points: 0,
      level: 1
    };

    return res.json({
      profile: {
        userId,
        stats: defaultStats,
        realBalance: 120.00,
        withdrawLimit: 100.00
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
      realBalance: typeof realBalance === 'number' ? realBalance : 120.00,
      withdrawLimit: typeof withdrawLimit === 'number' ? withdrawLimit : 100.00
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

  // GET /api/feed
  app.get("/api/feed", async (req, res) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.log("[FEED] Supabase not configured. Serving local persistent db posts.");
      return res.json({ posts: serverDb.getPosts(), source: "server_db" });
    }

    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[FEED] Failed to fetch from Supabase 'posts' table. Serving from server_db fallback.");
        return res.json({ posts: serverDb.getPosts(), source: "fallback_due_to_db_error" });
      }

      return res.json({ posts: data || [], source: "supabase" });
    } catch (err) {
      console.error("[FEED] Error querying Supabase:", err);
      return res.json({ posts: serverDb.getPosts(), source: "error" });
    }
  });

  // POST /api/feed
  app.post("/api/feed", async (req, res) => {
    const { username, userAvatarUrl, text, mediaBase64, mediaFileName, mediaUrl, mediaType } = req.body;

    if (!username || !text) {
      return res.status(400).json({ error: "Username e texto do post são obrigatórios" });
    }

    let media_url = mediaUrl || "";
    const supabase = getSupabaseClient();

    if (mediaBase64 && !media_url) {
      if (supabase) {
        const uploadedUrl = await uploadToSupabaseStorage(supabase, mediaBase64, mediaFileName || "upload.png");
        if (uploadedUrl) {
          media_url = uploadedUrl;
        } else {
          media_url = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600";
        }
      } else {
        media_url = mediaBase64.length < 1000000 ? mediaBase64 : "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600";
      }
    }

    const newPost = {
      id: `post-${Date.now()}`,
      username,
      userAvatarUrl: userAvatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(username)}`,
      text,
      media_url: media_url || undefined,
      media_type: mediaType || 'image',
      created_at: new Date().toISOString(),
      likes: [],
      evaluations: {},
      comments: []
    };

    serverDb.addPost(newPost);
    return res.json({ post: newPost, source: "server_db" });
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
    if (!postId || !userId || typeof rating !== 'number') {
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
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
