"use server"

import { config } from "dotenv"
config()

// Import all AI flows to register them
import "@/lib/ai/flows/analyze-blackboard-flow"
import "@/lib/ai/flows/draw-on-blackboard-flow"
import "@/lib/ai/flows/enhance-blackboard-flow"
