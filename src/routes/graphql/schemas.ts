import { Type } from '@fastify/type-provider-typebox';
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFloat,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLList,
  GraphQLEnumType,
} from 'graphql';
import { UUIDType } from './types/uuid.js';
import { PrismaClient } from '@prisma/client';
const prisma: PrismaClient = new PrismaClient();

export const gqlResponseSchema = Type.Partial(
  Type.Object({
    data: Type.Any(),
    errors: Type.Any(),
  }),
);
interface Args {
  id: string;
}
export const createGqlResponseSchema = {
  body: Type.Object(
    {
      query: Type.String(),
      variables: Type.Optional(Type.Record(Type.String(), Type.Any())),
    },
    {
      additionalProperties: false,
    },
  ),
};

// Types for SubscribersOnAuthors model
const MemberTypeIdType = new GraphQLEnumType({
  name: "MemberTypeId",
  values: {
    basic: { value: "basic" },
    business: { value: "business" },
  },
});

const SubscribersOnAuthorsType = new GraphQLObjectType({
  name: 'SubscribersOnAuthors',
  fields: () => ({
    subscriber: { type: UserType },
    subscriberId: { type: GraphQLString },
    author: { type: UserType },
    authorId: { type: GraphQLString },
  }),
});

// Types for Profile model
const ProfileType = new GraphQLObjectType({
  name: 'Profile',
  fields: () => ({
    id: { type: UUIDType },
    isMale: { type: GraphQLBoolean },
    yearOfBirth: { type: GraphQLInt },
    user: { type: UserType },
    userId: { type: GraphQLString },
    memberType: { type: MemberTypeType },
    memberTypeId: { type: MemberTypeIdType },
  }),
});

// Types for Post model
const PostType = new GraphQLObjectType({
  name: 'Post',
  fields: () => ({
    id: { type: UUIDType },
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    author: { type: UserType },
    authorId: { type: GraphQLString },
  }),
});

// Types for User model
const UserType: GraphQLObjectType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: UUIDType },
    name: { type: GraphQLString },
    balance: { type: GraphQLFloat },
    profile: { type: ProfileType },
    posts: { type: new GraphQLList(PostType) },
    userSubscribedTo: { type: new GraphQLList(UserType) },
    subscribedToUser: { type: new GraphQLList(UserType) },
  }),
});

// Types for MemberType model
const MemberTypeType: GraphQLObjectType = new GraphQLObjectType({
  name: 'MemberType',
  fields: () => ({
    id: { type: MemberTypeIdType },
    discount: { type: GraphQLFloat },
    postsLimitPerMonth: { type: GraphQLInt },
    profiles: { type: new GraphQLList(ProfileType) },
  }),
});

// Types for Query
const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    user: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args: Args) => {
        const user = await prisma.user.findUnique({
          where: {
            id: args.id,
          },
          include: {
            posts: true,
            profile: {
              include: {
                memberType: true,
              }
            },
          },
        });
        return user;
      },
    },
    users: {
      type: new GraphQLList(UserType),
      resolve: async () => {
        return prisma.user.findMany();
      },
    },
    userSubscribedTo: {
      type: MemberTypeType,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args: Args) => {
        return prisma.user.findMany({
          where: {
            userSubscribedTo: {
              some: {
                authorId: args.id,
              },
            },
          },
        });
      },
    },
    memberTypes: {
      type: new GraphQLList(MemberTypeType),
      resolve: async () => {
        return await prisma.memberType.findMany();
      },
    },
    memberType: {
      type: MemberTypeType,
      args: {
        id: { type: new GraphQLNonNull(MemberTypeIdType) },
      },
      resolve: async (_, args: Args) => {
        return await prisma.memberType.findUnique({
          where: {
            id: args.id,
          },
        });
      },
    },
    post: {
      type: PostType,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args: Args) => {
        return await prisma.post.findUnique({
          where: {
            id: args.id,
          },
        });
      },
    },
    posts: {
      type: new GraphQLList(PostType),
      resolve: async () => {
        return prisma.post.findMany();
      },
    },
    profile: {
      type: ProfileType,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args: Args) => {
        return await prisma.profile.findUnique({
          where: {
            id: args.id,
          },
          include: {
            memberType: true,
          }
        });
      },
    },
    profiles: {
      type: new GraphQLList(ProfileType),
      resolve: async () => {
        return prisma.profile.findMany();
      },
    },

  }),
});

// Creating the GraphQL Schema
const schema = new GraphQLSchema({
  query: QueryType,
});

export default schema;