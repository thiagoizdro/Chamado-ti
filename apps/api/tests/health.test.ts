import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { app } from '../src/app.js';

describe('GET /api/health', () => {
  it('responde 200 com status ok', async () => {
    const resposta = await request(app).get('/api/health');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ status: 'ok' });
  });
});
