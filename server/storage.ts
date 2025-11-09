import { 
  type User, 
  type InsertUser,
  type AnalysisHistoryRecord,
  type InsertAnalysisHistory,
  type DoctrineEntry,
  type DoctrineStore,
  type DoctrineRecord,
  type InsertDoctrine,
  type StoredText,
  type InsertStoredText,
  analysisHistory,
  users,
  doctrines,
  storedTexts
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
  
  getAllDoctrines(): Promise<DoctrineStore>;
  getDoctrine(key: string): Promise<string | undefined>;
  setDoctrine(key: string, value: string, description?: string): Promise<void>;
  deleteDoctrine(key: string): Promise<void>;
  initializeDefaultDoctrines(): Promise<void>;
  
  saveStoredText(text: InsertStoredText): Promise<StoredText>;
  getStoredTexts(userId?: string, limit?: number): Promise<StoredText[]>;
  getStoredTextById(id: string): Promise<StoredText | undefined>;
  getStoredTextsByIds(ids: string[]): Promise<StoredText[]>;
  deleteStoredText(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  constructor() {
    // No in-memory storage needed - using database for all operations
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
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

  async getAllDoctrines(): Promise<DoctrineStore> {
    const records = await db.select().from(doctrines);
    const store: DoctrineStore = {};
    for (const record of records) {
      store[record.key] = record.value;
    }
    return store;
  }

  async getDoctrine(key: string): Promise<string | undefined> {
    const [record] = await db.select()
      .from(doctrines)
      .where(eq(doctrines.key, key))
      .limit(1);
    return record?.value;
  }

  async setDoctrine(key: string, value: string, description?: string): Promise<void> {
    await db.insert(doctrines)
      .values({ key, value, description, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: doctrines.key,
        set: { value, description, updatedAt: new Date() }
      });
  }

  async deleteDoctrine(key: string): Promise<void> {
    await db.delete(doctrines).where(eq(doctrines.key, key));
  }

  async initializeDefaultDoctrines(): Promise<void> {
    const existingDoctrines = await db.select().from(doctrines).limit(1);
    if (existingDoctrines.length > 0) {
      return;
    }

    const defaultDoctrines: InsertDoctrine[] = [
      {
        key: "LAW_FORM",
        value: "dispositional proportionality (not universal regularity)",
        description: "Laws encode proportional dependencies among parameters, not exceptionless sequences"
      },
      {
        key: "DN_MODEL",
        value: "rejected",
        description: "Deductive-Nomological model is fundamentally mistaken"
      },
      {
        key: "EXPLANATION",
        value: "singular causal recognition → law quantifies proportionality",
        description: "Explanation requires articulating proportional structure, not subsumption under universal generalization"
      },
      {
        key: "REGULARITY_STATUS",
        value: "surface shadow; not constitutive",
        description: "Regularities are visible surface of dependencies, not their foundation"
      },
      {
        key: "EXPLANATION_ORDER",
        value: "instance_to_law",
        description: "We learn singular causal links first, then articulate laws; not law-to-instance as DN proposes"
      },
      {
        key: "LAW_TYPE",
        value: "proportional_dependencies",
        description: "Laws represent dispositional or statistical proportional constraints"
      }
    ];

    for (const doctrine of defaultDoctrines) {
      await db.insert(doctrines).values(doctrine);
    }
  }

  async saveStoredText(text: InsertStoredText): Promise<StoredText> {
    const [record] = await db.insert(storedTexts).values(text).returning();
    return record;
  }

  async getStoredTexts(userId?: string, limit: number = 100): Promise<StoredText[]> {
    if (userId) {
      return await db.select()
        .from(storedTexts)
        .where(eq(storedTexts.userId, userId))
        .orderBy(desc(storedTexts.createdAt))
        .limit(limit);
    }
    
    return await db.select()
      .from(storedTexts)
      .orderBy(desc(storedTexts.createdAt))
      .limit(limit);
  }

  async getStoredTextById(id: string): Promise<StoredText | undefined> {
    const [record] = await db.select()
      .from(storedTexts)
      .where(eq(storedTexts.id, id))
      .limit(1);
    
    return record;
  }

  async getStoredTextsByIds(ids: string[]): Promise<StoredText[]> {
    if (ids.length === 0) return [];
    
    return await db.select()
      .from(storedTexts)
      .where(eq(storedTexts.id, ids[0])); // Simple implementation for now
  }

  async deleteStoredText(id: string): Promise<void> {
    await db.delete(storedTexts).where(eq(storedTexts.id, id));
  }
}

export const storage = new MemStorage();
