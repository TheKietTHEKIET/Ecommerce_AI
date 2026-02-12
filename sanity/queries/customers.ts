import { defineQuery } from "next-sanity";

/**
 * Get customer by email
 * Returns a single customer document or null if not found
 */
export const CUSTOMER_BY_EMAIL_QUERY = defineQuery(`
  *[_type == "customer" && email == $email][0] {
    _id,
    email,
    name,
    clerkUserId,
    stripeCustomerId,
    createdAt
  }
`);

/**
 * Get customer by Stripe Customer ID
 * Returns a single customer document or null if not found
 */
export const CUSTOMER_BY_STRIPE_ID_QUERY = defineQuery(`
  *[_type == "customer" && stripeCustomerId == $stripeCustomerId][0] {
    _id,
    email,
    name,
    clerkUserId,
    stripeCustomerId,
    createdAt
  }
`);