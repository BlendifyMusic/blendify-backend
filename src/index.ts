import { NestFactory } from '@nestjs/core';
import * as functions from 'firebase-functions';
import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';

const server = express();

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.enableCors();
  await app.init();
};

let isBootstrapped = false;

export const api = functions.https.onRequest(async (req, res) => {
  if (!isBootstrapped) {
    await bootstrap();
    isBootstrapped = true;
  }
  server(req, res);
});
