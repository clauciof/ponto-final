/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import express, {Request, Response} from "express";
import * as logger from "firebase-functions/logger";


import {initializeApp, applicationDefault} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

// const cors = require("cors")({ origin: true });
const firebaseApp = initializeApp({credential: applicationDefault()});

const db = getFirestore(firebaseApp, "pontofinal");

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

const app = express();


app.get("/health-check", (req: Request, res: Response) => {
  logger.info("Hello logs!", {structuredData: true});
  res.send("Serverless Products API is running!");
});

app.get("/products", async (req: Request, res: Response) => {
  logger.info("List products");
  try {
    const snapshot = await db.collection("produtos").get();
    const products = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
    res.status(200).json(products);
  } catch (error) {
    logger.error("Error fetching products", error);
    res.status(500).send({error: "Failed to fetch products"});
  }
});

app.get("/product/:id", async (req: Request, res: Response) => {
  logger.info("Get product", { productId: req.params.id });
  try {
    const { id } = req.params;
    const doc = await db.collection("produtos").doc(id).get();
    if (!doc.exists) {
      res.status(404).send({ error: "Product not found" });
      return;
    }
    res.status(200).json({ id: doc.id, ...doc.data() });
    return;
  } catch (error) {
    logger.error("Error fetching products", error);
    res.status(500).send({error: "Failed to fetch products"});
    return;
  }
});

app.get("/new-products", async (req: Request, res: Response) => {
  logger.info("List products");
  try {
    const snapshot = await db.collection("produtos").get();
    const products = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
    if (products.length >= 4) {
      res.status(200).json(products.slice(0, 4));
    } else {
      res.status(200).json(products);
    }
  } catch (error) {
    logger.error("Error fetching products", error);
    res.status(500).send({error: "Failed to fetch products"});
  }
});

export const api = onRequest(app);
