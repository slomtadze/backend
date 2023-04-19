const { gql } = require("apollo-server-express");
const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    password: String!
    count: Int!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input SignupInput {
    name: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type Query {
    getUser(id: ID!): User
  }

  type Mutation {
    signup(input: SignupInput!): AuthPayload
    login(input: LoginInput!): AuthPayload
  }
`;

module.exports = typeDefs;
