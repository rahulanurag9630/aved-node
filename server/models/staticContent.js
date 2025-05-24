import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate';
import status from '../enums/status';
import staticContent from "../enums/staticContent";


var staticContentModel = new Schema({

  contentType: {
    type: String,
    enum: [staticContent.aboutUs, staticContent.privacyPolicy, staticContent.termsCondition, staticContent.faq, staticContent.banner,
    staticContent.conversationStarter, staticContent.gettingStarted
    ],
  },
  title: { type: String },
  description: { type: String },
  question: { type: String },
  answer: { type: String },
  imageUrl: { type: String },
  isActive: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    default: status.ACTIVE
  }
}, { timestamps: true });


staticContentModel.plugin(mongoosePaginate);
staticContentModel.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model('staticContent', staticContentModel);

const StaticContent = Mongoose.model("staticContent", staticContentModel);

const initializeStaticContent = async () => {
  try {
    const result = await StaticContent.find({ status: "ACTIVE" });

    if (result.length > 0) {
      console.log("✅ Default static content already exists.");
      return;
    }

    const staticData = [

      {
        contentType: staticContent.aboutUs,
        title: "About Us",
        description: `Muirl is a modern dating app designed to help genuine people build meaningful connections. We focus on real conversations, shared interests, and respectful interactions—making dating feel natural, fun, and safe.`
      },

      {
        contentType: staticContent.privacyPolicy,
        title: "Privacy Policy",
        description: `At Muirl, your privacy is our priority. We collect only the information necessary to provide a safe and personalized dating experience. Your data is stored securely and never sold to third parties. You control what you share and with whom. By using Muirl, you agree to our use of your information in line with this policy to enhance your experience and safety.`
      },
      {
        contentType: staticContent.termsCondition,
        title: "Terms and Condition",
        description: `Welcome to Muirl! By using our app, you agree to the following terms:
Eligibility: You must be 18 years or older to use Muirl.
Account Responsibility: Keep your login details secure. You're responsible for all activity under your account.
Content: You may not post harmful, offensive, or fake content. Muirl reserves the right to remove any content or suspend users violating our policies.
Privacy: We protect your data as outlined in our Privacy Policy.
Conduct: Respect others. Harassment, abuse, or discrimination of any kind is strictly prohibited.
Termination: We may suspend or terminate your account if you violate these terms.`
      },
      {
        contentType: staticContent.faq,
        title: "FAQ",
        question: "1. How does Muirl match people?",
        answer: "Muirl uses shared interests, location, and profile preferences to help you connect with like-minded people genuinely."
      },
      {
        contentType: staticContent.faq,
        title: "FAQ",
        question: "2. Is Muirl free to use?",
        answer: "Yes, Muirl is free to use with optional premium features to enhance your experience."
      },
      {
        contentType: staticContent.faq,
        title: "FAQ",
        question: "3. How do I report someone?",
        answer: "You can report any user by visiting their profile and tapping the “Report” option. We take safety seriously."
      },
      {
        contentType: staticContent.faq,
        title: "FAQ",
        question: "4. Is my data safe?",
        answer: "Absolutely. We prioritize your privacy and never share your info without consent."
      }
    ];

    const inserted = await StaticContent.insertMany(staticData);
    console.log("📥 Default static content inserted:", inserted.length);

  } catch (err) {
    console.error("❌ Error initializing static content:", err);
  }
};

initializeStaticContent();
