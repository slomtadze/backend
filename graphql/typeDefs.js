
const typeDefs = `
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

  union TokenInput = token | refreshToken

  input CheckUserInput {
    input: TokenInput!
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

export default typeDefs;
