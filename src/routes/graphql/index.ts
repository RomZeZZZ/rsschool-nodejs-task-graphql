import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { graphql } from 'graphql';
import schema from './schemas.js';

const plugin: FastifyPluginAsyncTypebox   = async (fastify) => {
  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req) {
      console.log('Request received!'); 
      return await graphql({ schema: schema, source: req.body.query, variableValues: req.body.variables });
    },
  });
};

export default plugin;
