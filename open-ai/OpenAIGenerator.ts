import OpenAI from "openai";
import AIGeneratedImage from "./AIGeneratedImage";

class OpenAIGenerator {
  private readonly openAI: OpenAI;

  constructor(organization: string, project: string, apiKey: string) {
    this.openAI = new OpenAI({
      dangerouslyAllowBrowser: true,
      organization,
      project,
      apiKey,
    });
  }

  async generateImage(
    prompt?: string,
    format: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792" = "1024x1024",
  ): Promise<AIGeneratedImage | undefined> {
    try {
      const response = await this.openAI.images.generate({
        prompt: prompt ?? "",
        n: 1,
        size: format,
        response_format: "b64_json",
      });
      const b64 = response.data?.[0]?.b64_json;
      if (!b64) return undefined;
      const [width, height] = format.split("x").map(Number);
      return new AIGeneratedImage(prompt ?? "", b64, width, height);
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }
}

export default OpenAIGenerator;
