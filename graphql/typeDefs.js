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

  type CheckPayload {
    user: User!
  }

  input CheckUserInput {
    token: String!
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
    getUser(token: String!): User
  }

  type Mutation {
    checkUser(input: CheckUserInput!): CheckPayload
    signup(input: SignupInput!): AuthPayload
    login(input: LoginInput!): AuthPayload
  }
`;

module.exports = typeDefs;
