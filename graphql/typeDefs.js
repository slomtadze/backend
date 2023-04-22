
const typeDefs = `#graphql
  type User {
    _id: ID!
    name: String!
    count: Int!
  }

  type Subscription {
    userCountUpdated: Int!
  }  

  type AuthPayload {
    token: String!
    refreshToken: String!
    user: User!
  }
  
  type CheckPayload {
    user: User!
  }

  type RefreshTokenPayload {
    token: String!
    user: User
  }

  input CheckUserInput {
    token: String!
  }
  input RefreshTokenInput {
    refreshToken: String!
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
    userCountUpdated: Int
  }

  type Mutation {
    checkUser(input: CheckUserInput!): CheckPayload
    refreshToken(input: RefreshTokenInput!): RefreshTokenPayload
    signup(input: SignupInput!): AuthPayload
    login(input: LoginInput!): AuthPayload
  }
`;

export default typeDefs;
