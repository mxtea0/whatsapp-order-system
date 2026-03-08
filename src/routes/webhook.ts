import { Router, Request, Response } from 'express';
import whatsappService from '../services/whatsappService';
import messageHandler from '../services/messageHandler';

const router = Router();

/**
 * WhatsApp Webhook GET endpoint - Verification
 */
router.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    const verificationResult = whatsappService.verifyWebhook(
      mode as string,
      token as string,
      challenge as string
    );

    if (verificationResult) {
      res.status(200).send(verificationResult);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

/**
 * WhatsApp Webhook POST endpoint - Receive messages
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // WhatsApp mesajı kontrolü
    if (body.object) {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0] &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        const message = body.entry[0].changes[0].value.messages[0];
        const from = message.from;
        const messageId = message.id;
        const messageType = message.type;

        let messageContent: any;

        // Mesaj tipine göre içeriği al
        if (messageType === 'text') {
          messageContent = message.text.body;
        } else if (messageType === 'interactive') {
          messageContent = message.interactive;
        } else {
          // Desteklenmeyen mesaj tipi
          console.log('Desteklenmeyen mesaj tipi:', messageType);
          res.sendStatus(200);
          return;
        }

        // Mesajı işle
        await messageHandler.handleIncomingMessage(from, messageType, messageContent, messageId);
      }

      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('Webhook hatası:', error);
    res.sendStatus(500);
  }
});

export default router;