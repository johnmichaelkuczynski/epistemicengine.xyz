import { 
  type User, 
  type InsertUser,
  type AnalysisHistoryRecord,
  type InsertAnalysisHistory,
  analysisHistory,
  users
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { desc, eq, and } from "drizzle-orm";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  saveAnalysis(analysis: InsertAnalysisHistory): Promise<AnalysisHistoryRecord>;
  getAnalysisHistory(userId?: string, limit?: number): Promise<AnalysisHistoryRecord[]>;
  getAnalysisById(id: string): Promise<AnalysisHistoryRecord | undefined>;
  deleteAnalysis(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private usersMap: Map<string, User>;

  constructor() {
    this.usersMap = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = { 
      id, 
      username: insertUser.username,
      passwordHash: insertUser.passwordHash,
      createdAt: now
    };
    this.usersMap.set(id, user);
    return user;
  }

  async saveAnalysis(analysis: InsertAnalysisHistory): Promise<AnalysisHistoryRecord> {
    const [record] = await db.insert(analysisHistory).values(analysis).returning();
    return record;
  }

  async getAnalysisHistory(userId?: string, limit: number = 50): Promise<AnalysisHistoryRecord[]> {
    if (userId) {
      return await db.select()
        .from(analysisHistory)
        .where(eq(analysisHistory.userId, userId))
        .orderBy(desc(analysisHistory.createdAt))
        .limit(limit);
    }
    
    return await db.select()
      .from(analysisHistory)
      .orderBy(desc(analysisHistory.createdAt))
      .limit(limit);
  }

  async getAnalysisById(id: string): Promise<AnalysisHistoryRecord | undefined> {
    const [record] = await db.select()
      .from(analysisHistory)
      .where(eq(analysisHistory.id, id))
      .limit(1);
    
    return record;
  }

  async deleteAnalysis(id: string): Promise<void> {
    await db.delete(analysisHistory).where(eq(analysisHistory.id, id));
  }
}

export const storage = new MemStorage();
