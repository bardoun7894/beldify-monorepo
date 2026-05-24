import { Message, Shop } from "@/types/community";

// Mock shop data
export const mockShops: Record<string, Shop> = {
  "1": {
    id: "1",
    name: "Elegance Furniture",
    slug: "elegance-furniture",
    status: "active",
    isVerified: true,
    logo: "/images/shops/elegance-furniture-logo.jpg",
    banner: "/images/shops/elegance-furniture-banner.jpg",
    description: "Premium handcrafted furniture for modern homes",
    website: "https://elegancefurniture.com",
    rating: 4.8,
    totalReviews: 124,
    storeUrl: "/shops/elegance-furniture"
  },
  "2": {
    id: "2",
    name: "Moroccan Artisan Textiles",
    slug: "moroccan-artisan-textiles",
    status: "active",
    isVerified: true,
    logo: "/images/shops/moroccan-textiles-logo.jpg",
    banner: "/images/shops/moroccan-textiles-banner.jpg",
    description: "Authentic handwoven textiles from Moroccan artisans",
    website: "https://moroccantextiles.com",
    rating: 4.9,
    totalReviews: 89,
    storeUrl: "/shops/moroccan-artisan-textiles"
  },
  "3": {
    id: "3",
    name: "Modern Design Studio",
    slug: "modern-design-studio",
    status: "active",
    isVerified: true,
    logo: "/images/shops/modern-design-logo.jpg",
    banner: "/images/shops/modern-design-banner.jpg",
    description: "Contemporary furniture and home accessories",
    website: "https://moderndesignstudio.com",
    rating: 4.7,
    totalReviews: 156,
    storeUrl: "/shops/modern-design-studio"
  }
};

// Mock message data by shop
export const mockMessages: Record<string, Record<string, Message[]>> = {
  // Shop ID 1 messages
  "1": {
    // Post-specific messages
    "101": [
      {
        id: "1001",
        content: "Hello, I'm interested in your dining table post. Do you have this in walnut finish?",
        senderId: "user1",
        recipientId: "1",
        senderType: "buyer",
        postId: "101",
        created_at: "2025-05-20T14:30:00Z",
        updated_at: "2025-05-20T14:30:00Z",
        sender: {
          id: "user1",
          name: "Ahmed Khalid",
          avatar: null
        }
      },
      {
        id: "1002",
        content: "Yes, we offer this dining table in walnut, oak, and mahogany finishes. The walnut has a beautiful deep grain pattern. Would you like to see some samples?",
        senderId: "1",
        recipientId: "user1",
        senderType: "seller",
        postId: "101",
        created_at: "2025-05-20T15:45:00Z",
        updated_at: "2025-05-20T15:45:00Z",
        sender: {
          id: "1",
          name: "Elegance Furniture",
          avatar: "/images/shops/elegance-furniture-logo.jpg"
        }
      },
      {
        id: "1003",
        content: "That would be great! Can you also tell me the lead time for delivery?",
        senderId: "user1",
        recipientId: "1",
        senderType: "buyer",
        postId: "101",
        created_at: "2025-05-20T16:10:00Z",
        updated_at: "2025-05-20T16:10:00Z",
        sender: {
          id: "user1",
          name: "Ahmed Khalid",
          avatar: null
        }
      }
    ],
    // General messages (no post ID)
    "general": [
      {
        id: "2001",
        content: "Do you have any ongoing promotions for living room furniture?",
        senderId: "user1",
        recipientId: "1",
        senderType: "buyer",
        created_at: "2025-05-22T10:15:00Z",
        updated_at: "2025-05-22T10:15:00Z",
        sender: {
          id: "user1",
          name: "Ahmed Khalid",
          avatar: null
        }
      },
      {
        id: "2002",
        content: "Yes! We're currently offering a 15% discount on all coffee tables and side tables until the end of the month. Would you like to see our collection?",
        senderId: "1",
        recipientId: "user1",
        senderType: "seller",
        created_at: "2025-05-22T11:30:00Z",
        updated_at: "2025-05-22T11:30:00Z",
        sender: {
          id: "1",
          name: "Elegance Furniture",
          avatar: "/images/shops/elegance-furniture-logo.jpg"
        }
      }
    ]
  },
  // Shop ID 2 messages
  "2": {
    // Post-specific messages
    "102": [
      {
        id: "3001",
        content: "I love your Berber rug designs. Do you have them in custom sizes?",
        senderId: "user1",
        recipientId: "2",
        senderType: "buyer",
        postId: "102",
        created_at: "2025-05-18T09:20:00Z",
        updated_at: "2025-05-18T09:20:00Z",
        sender: {
          id: "user1",
          name: "Ahmed Khalid",
          avatar: null
        }
      },
      {
        id: "3002",
        content: "Yes, we specialize in custom sizes for all our rugs. What dimensions are you looking for?",
        senderId: "2",
        recipientId: "user1",
        senderType: "seller",
        postId: "102",
        created_at: "2025-05-18T10:05:00Z",
        updated_at: "2025-05-18T10:05:00Z",
        sender: {
          id: "2",
          name: "Moroccan Artisan Textiles",
          avatar: "/images/shops/moroccan-textiles-logo.jpg"
        }
      }
    ],
    // General messages
    "general": []
  },
  // Shop ID 3 messages
  "3": {
    // Post-specific messages 
    "103": [],
    // General messages
    "general": []
  }
};

// Helper function to get messages
export const getMockMessages = (shopId: string, postId?: string): Message[] => {
  if (!mockMessages[shopId]) {
    return [];
  }
  
  // If postId is provided, return post-specific messages
  if (postId && mockMessages[shopId][postId]) {
    return mockMessages[shopId][postId];
  }
  
  // Otherwise return general messages
  return mockMessages[shopId]["general"] || [];
};

// Helper function to get shop details
export const getMockShop = (shopId: string): Shop | null => {
  // If we have the shop in our mock data, return it with enhanced structure
  if (mockShops[shopId]) {
    const shop = mockShops[shopId];
    // Return with both top-level properties and nested shop object for compatibility
    return {
      ...shop,
      // Add snake_case variants for API compatibility
      shop_name: shop.name,
      is_online: Math.random() > 0.5, // Randomly online for testing
      last_seen: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString(), // Random last seen within 24h
      is_verified: shop.isVerified,
      // Add nested shop object for component compatibility
      shop: {
        ...shop,
        is_verified: shop.isVerified,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 31536000000)).toISOString(), // Random creation date within last year
        review_count: shop.totalReviews
      }
    };
  }
  
  // If not found, create a default shop with the ID
  return {
    id: shopId,
    name: `Shop ${shopId}`,
    shop_name: `Shop ${shopId}`,
    slug: `shop-${shopId}`,
    status: "active",
    isVerified: true,
    is_verified: true,
    logo: "/images/shop-placeholder.png",
    avatar: "/images/shop-placeholder.png",
    image: "/images/shop-placeholder.png",
    banner: "/images/shop-banner-placeholder.jpg",
    description: "This is a mock shop for testing purposes",
    website: `https://shop${shopId}.example.com`,
    rating: 4.5,
    totalReviews: 42,
    review_count: 42,
    storeUrl: `/shops/shop-${shopId}`,
    is_online: Math.random() > 0.5,
    last_seen: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString(),
    created_at: new Date(Date.now() - Math.floor(Math.random() * 31536000000)).toISOString(),
    shop: {
      id: shopId,
      name: `Shop ${shopId}`,
      slug: `shop-${shopId}`,
      status: "active",
      isVerified: true,
      is_verified: true,
      logo: "/images/shop-placeholder.png",
      description: "This is a mock shop for testing purposes",
      website: `https://shop${shopId}.example.com`,
      rating: 4.5,
      totalReviews: 42,
      review_count: 42,
      storeUrl: `/shops/shop-${shopId}`,
      created_at: new Date(Date.now() - Math.floor(Math.random() * 31536000000)).toISOString(),
      phone: "+212 555-123-456"
    }
  };
};

// Helper function to add a new message
export const addMockMessage = (shopId: string, content: string, postId?: string): Message => {
  // Create a new message object
  const newMessage: Message = {
    id: Date.now().toString(),
    content,
    senderId: "user1", // Mock user ID
    recipientId: shopId,
    senderType: "buyer",
    postId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sender: {
      id: "user1",
      name: "Ahmed Khalid", // Mock user name
      avatar: null
    }
  };
  
  // Determine where to store the message
  const messageKey = postId || "general";
  
  // Initialize shop messages if they don't exist
  if (!mockMessages[shopId]) {
    mockMessages[shopId] = {};
  }
  
  // Initialize message array if it doesn't exist
  if (!mockMessages[shopId][messageKey]) {
    mockMessages[shopId][messageKey] = [];
  }
  
  // Add the message
  mockMessages[shopId][messageKey].push(newMessage);
  
  return newMessage;
};
