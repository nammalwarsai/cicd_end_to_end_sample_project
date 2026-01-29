import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { supabase } from "./config/supabase.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration to allow frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "Backend running", status: "ok" });
});

// Test Supabase connection
app.get("/api/health", async (req, res) => {
  try {
    // Simple health check - just verify we can reach Supabase
    const { error } = await supabase.from("data").select("count", { count: "exact", head: true });
    if (error) {
      console.log("Supabase check error:", error.message);
      // Still return OK for backend, just note DB status
      return res.json({ status: "ok", message: "Backend connected (DB: " + error.message + ")" });
    }
    res.json({ status: "ok", message: "Backend and Supabase connected" });
  } catch (err) {
    res.json({ status: "ok", message: "Backend running" });
  }
});

// Get all data from the database table
app.get("/api/data", async (req, res) => {
  try {
    const { data, error } = await supabase.from("data").select("*").order("id", { ascending: true });
    
    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ status: "error", message: error.message });
    }
    
    res.json({ status: "ok", data: data });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Create new data
app.post("/api/data", async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ status: "error", message: "Name is required" });
    }
    
    const { data, error } = await supabase.from("data").insert([{ name }]).select();
    
    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ status: "error", message: error.message });
    }
    
    res.json({ status: "ok", data: data[0] });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Update data by ID
app.put("/api/data/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ status: "error", message: "Name is required" });
    }
    
    const { data, error } = await supabase
      .from("data")
      .update({ name })
      .eq("id", id)
      .select();
    
    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ status: "error", message: error.message });
    }
    
    res.json({ status: "ok", data: data[0] });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Delete data by ID
app.delete("/api/data/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase.from("data").delete().eq("id", id);
    
    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ status: "error", message: error.message });
    }
    
    res.json({ status: "ok", message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
