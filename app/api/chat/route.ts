import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

type UrlCitation = { type: "url_citation"; title?: string; url: string };

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_VECTOR_STORE_ID) return NextResponse.json({ error: "The study assistant has not been connected yet." }, { status: 503 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { question, allowWeb } = body as { question?: unknown; allowWeb?: unknown };
  if (typeof question !== "string" || !question.trim() || question.length > 2000) return NextResponse.json({ error: "Enter a question under 2,000 characters." }, { status: 400 });

  const tools: OpenAI.Responses.Tool[] = [{ type: "file_search", vector_store_ids: [process.env.OPENAI_VECTOR_STORE_ID], max_num_results: 8 }];
  if (allowWeb !== false) tools.push({ type: "web_search" });
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      instructions: "You are the OpenNotes study assistant. Search the student's notes first. Clearly separate 'From your notes' from 'Additional context' when web information is used. Never invent note content. Say when the notes do not cover the question. Preserve web citations. Be educational and do not complete graded work dishonestly.",
      input: question.trim(),
      tools,
      include: ["file_search_call.results"],
    });
    const citations: { title: string; url: string }[] = [];
    for (const item of result.output) if (item.type === "message") for (const content of item.content) if (content.type === "output_text") for (const annotation of content.annotations) if (annotation.type === "url_citation") {
      const citation = annotation as UrlCitation;
      if (!citations.some((source) => source.url === citation.url)) citations.push({ title: citation.title || citation.url, url: citation.url });
    }
    return NextResponse.json({ answer: result.output_text, citations });
  } catch (error) {
    console.error("OpenNotes assistant error", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "The assistant could not answer right now." }, { status: 500 });
  }
}
