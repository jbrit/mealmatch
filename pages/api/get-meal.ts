import { SYSTEM_PROMPT } from "@/prompts";
import type { NextApiRequest, NextApiResponse } from "next";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
type MealData = {
  meal_name: string;
  description: string;
  time_required: string;
  ingredients: string[];
  steps: string[];
  error: boolean;
  message?: "string";
};

type Data =
  | {
      // errors only
      message: string;
      error: boolean;
    }
  | MealData;
const mealCache: Record<string, MealData> = {};
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (typeof req.query.meal !== "string")
    return res.status(400).send({ message: "Could not find meal", error: true});
  if (!mealCache[req.query.meal as string]) {
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: req.query.meal as string,
        },
      ],
    });
    console.log(response.data.choices[0].message?.content)
    mealCache[req.query.meal as string] = JSON.parse(
      response.data.choices[0].message?.content as string
    ) as MealData;
  }
  const data = mealCache[req.query.meal as string];
  if (data.error) return res.status(400).send(data);
  res.status(200).json(data);
}
