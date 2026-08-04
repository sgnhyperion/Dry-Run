// import fs from "fs";
// import path from "path";
// import type { NextApiRequest, NextApiResponse } from "next";

// export default function handler(req: NextApiRequest, res: NextApiResponse) {
//   const dir = path.join(process.cwd(), "public/audio/downloaded");
//   const files = fs.readdirSync(dir).filter(f => f.endsWith(".wav") || f.endsWith(".mp3"));
//   res.status(200).json(files);
// }

import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const dir = path.join(process.cwd(), "public/audio/downloaded");

  if (!fs.existsSync(dir)) {
    res.status(200).json([]);
    return;
  }
    
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".wav") || f.endsWith(".mp3"));
  res.status(200).json(files);
}