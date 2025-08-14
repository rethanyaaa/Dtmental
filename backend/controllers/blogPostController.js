import blogPostModel from "../models/blogPostModel.js";
import userModel from "../models/userModel.js";
import commentModel from "../models/commentModel.js";

// Submit a new blog post
export const submitBlogPost = async (req, res) => {
  try {
    const { title, category, content, tags, imageUrl, isAnonymous } = req.body;

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const userId = req.user.id;

    // Validate required fields
    if (!title || !category || !content) {
      return res.status(400).json({
        success: false,
        message: "Title, category, and content are required",
      });
    }

    // Get user data
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate unique slug from title
    const generateUniqueSlug = async (title) => {
      let baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
        .trim("-"); // Remove leading/trailing hyphens

      // Ensure slug is not empty
      if (baseSlug === "") {
        baseSlug = "blog-post-" + Date.now();
      }

      // Check if slug already exists and make it unique
      let slug = baseSlug;
      let counter = 1;

      while (true) {
        const existingPost = await blogPostModel.findOne({ slug });
        if (!existingPost) {
          break;
        }
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      return slug;
    };

    // Generate unique slug
    const uniqueSlug = await generateUniqueSlug(title);

    // Create blog post
    const blogPost = new blogPostModel({
      authorId: userId,
      author: isAnonymous ? "Anonymous" : user.name || user.username || "User",
      title,
      slug: uniqueSlug, // Use the generated unique slug
      category,
      content,
      tags: tags
        ? tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag)
        : [],
      imageUrl,
      isAnonymous,
      status: "pending",
      submittedAt: new Date(),
    });

    console.log("Before save - Title:", blogPost.title, "Slug:", blogPost.slug);
    await blogPost.save();
    console.log("After save - Title:", blogPost.title, "Slug:", blogPost.slug);

    res.status(201).json({
      success: true,
      message:
        "Blog post submitted successfully! It will be reviewed by our team.",
      data: {
        id: blogPost._id,
        title: blogPost.title,
        status: blogPost.status,
        submittedAt: blogPost.submittedAt,
      },
    });
  } catch (error) {
    console.error("Error submitting blog post:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all approved blog posts (for public viewing)
export const getApprovedBlogPosts = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;

    const query = { status: "approved" };

    // Filter by category
    if (category && category !== "all") {
      query.category = category;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const blogPosts = await blogPostModel
      .find(query)
      .sort({ publishedAt: -1, submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-adminNotes");

    const total = await blogPostModel.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        posts: blogPosts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalPosts: total,
          hasNext: skip + blogPosts.length < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get featured blog posts
export const getFeaturedBlogPosts = async (req, res) => {
  try {
    const featuredPosts = await blogPostModel
      .find({
        status: "approved",
        isFeatured: true,
      })
      .sort({ publishedAt: -1 })
      .limit(5)
      .select("-adminNotes");

    res.status(200).json({
      success: true,
      data: featuredPosts,
    });
  } catch (error) {
    console.error("Error fetching featured posts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get user's blog posts
export const getUserBlogPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const query = { authorId: userId };
    if (status) {
      query.status = status;
    }

    const blogPosts = await blogPostModel
      .find(query)
      .sort({ submittedAt: -1 })
      .select("-adminNotes");

    res.status(200).json({
      success: true,
      data: blogPosts,
    });
  } catch (error) {
    console.error("Error fetching user blog posts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get single blog post by ID
export const getBlogPostById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the id is a valid ObjectId (24 character hex string)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    let blogPost;

    if (isValidObjectId) {
      // Try to find by ObjectId first
      blogPost = await blogPostModel.findById(id);
    }

    // If not found by ObjectId or not a valid ObjectId, try to find by slug
    if (!blogPost) {
      blogPost = await blogPostModel.findOne({ slug: id });
    }

    if (!blogPost) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    // Only return approved posts for public access
    if (blogPost.status !== "approved") {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    // Increment view count
    blogPost.views += 1;
    await blogPost.save();

    res.status(200).json({
      success: true,
      data: blogPost,
    });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Admin: Get all pending blog posts
export const getPendingBlogPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const pendingPosts = await blogPostModel
      .find({ status: "pending" })
      .populate("authorId", "name username email")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await blogPostModel.countDocuments({ status: "pending" });

    res.status(200).json({
      success: true,
      data: {
        posts: pendingPosts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalPosts: total,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching pending blog posts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Admin: Approve or reject blog post
export const reviewBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, isFeatured = false } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'approved' or 'rejected'",
      });
    }

    const blogPost = await blogPostModel.findById(id);

    if (!blogPost) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    blogPost.status = status;
    blogPost.adminNotes = adminNotes;
    blogPost.isFeatured = status === "approved" ? isFeatured : false;

    if (status === "approved") {
      blogPost.publishedAt = new Date();
    }

    await blogPost.save();

    res.status(200).json({
      success: true,
      message: `Blog post ${status} successfully`,
      data: {
        id: blogPost._id,
        status: blogPost.status,
        publishedAt: blogPost.publishedAt,
      },
    });
  } catch (error) {
    console.error("Error reviewing blog post:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Like a blog post
export const likeBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if the id is a valid ObjectId (24 character hex string)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    let blogPost;

    if (isValidObjectId) {
      // Try to find by ObjectId first
      blogPost = await blogPostModel.findById(id);
    }

    // If not found by ObjectId or not a valid ObjectId, try to find by slug
    if (!blogPost) {
      blogPost = await blogPostModel.findOne({ slug: id });
    }

    if (!blogPost) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    if (blogPost.status !== "approved") {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    // Increment likes
    blogPost.likes += 1;
    await blogPost.save();

    res.status(200).json({
      success: true,
      message: "Blog post liked successfully",
      data: {
        likes: blogPost.likes,
      },
    });
  } catch (error) {
    console.error("Error liking blog post:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Add comment to blog post
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, isAnonymous = false } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    // Check if the id is a valid ObjectId (24 character hex string)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    let blogPost;

    if (isValidObjectId) {
      // Try to find by ObjectId first
      blogPost = await blogPostModel.findById(id);
    }

    // If not found by ObjectId or not a valid ObjectId, try to find by slug
    if (!blogPost) {
      blogPost = await blogPostModel.findOne({ slug: id });
    }

    if (!blogPost) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    if (blogPost.status !== "approved") {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    // Get user data
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Create comment
    const comment = new commentModel({
      blogPostId: blogPost._id, // Use the actual ObjectId from the found blog post
      authorId: userId,
      author: isAnonymous ? "Anonymous" : user.name || user.username || "User",
      content: content.trim(),
      isAnonymous,
    });

    await comment.save();

    // Increment comment count on blog post
    blogPost.comments += 1;
    await blogPost.save();

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: {
        id: comment._id,
        content: comment.content,
        author: comment.author,
        createdAt: comment.createdAt,
      },
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get comments for blog post
export const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if the id is a valid ObjectId (24 character hex string)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    let blogPost;

    if (isValidObjectId) {
      // Try to find by ObjectId first
      blogPost = await blogPostModel.findById(id);
    }

    // If not found by ObjectId or not a valid ObjectId, try to find by slug
    if (!blogPost) {
      blogPost = await blogPostModel.findOne({ slug: id });
    }

    if (!blogPost) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    if (blogPost.status !== "approved") {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    const skip = (page - 1) * limit;

    const comments = await commentModel
      .find({ blogPostId: blogPost._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await commentModel.countDocuments({
      blogPostId: blogPost._id,
    });

    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalComments: total,
          hasNext: skip + comments.length < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
