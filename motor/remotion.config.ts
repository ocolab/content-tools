// Solo para `npm run estudio` (vista previa). El render de verdad lo hace
// scripts/render.mjs con sus propias opciones fijas.
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("png");
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");
Config.setCrf(18);
