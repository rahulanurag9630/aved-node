import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import status from "../enums/status";
import staticContent from "../enums/staticContent";

var staticContentModel = new Schema(
  {
    contentType: {
      type: String,
      enum: [
        staticContent.aboutUs,
        staticContent.privacyPolicy,
        staticContent.termsCondition,
        staticContent.faq,
        staticContent.banner,
        staticContent.conversationStarter,
        staticContent.gettingStarted,
      ],
    },
    title: { type: String },
    title_ar: { type: String }, // Arabic title
    description: { type: String },
    description_ar: { type: String }, // Arabic description
    question: { type: String },
    question_ar: { type: String }, // Arabic question
    answer: { type: String },
    answer_ar: { type: String }, // Arabic answer
    imageUrl: { type: String },
    isActive: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: status.ACTIVE,
    },
  },
  { timestamps: true }
);

staticContentModel.plugin(mongoosePaginate);
staticContentModel.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("staticContent", staticContentModel);

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
        title_ar: "معلومات عنا",
        description: `Muirl is a modern dating app designed to help genuine people build meaningful connections. We focus on real conversations, shared interests, and respectful interactions—making dating feel natural, fun, and safe.`,
        description_ar: `Muirl هو تطبيق مواعدة حديث يساعد الأشخاص الحقيقيين على بناء علاقات ذات مغزى. نركز على المحادثات الحقيقية والاهتمامات المشتركة والتفاعل المحترم، مما يجعل المواعدة طبيعية وممتعة وآمنة.`,
      },
      {
        contentType: staticContent.privacyPolicy,
        title: "Privacy Policy",
        title_ar: "سياسة الخصوصية",
        description: `At Muirl, your privacy is our priority. We collect only the information necessary to provide a safe and personalized dating experience. Your data is stored securely and never sold to third parties. You control what you share and with whom. By using Muirl, you agree to our use of your information in line with this policy to enhance your experience and safety.`,
        description_ar: `في Muirl، خصوصيتك هي أولويتنا. نجمع فقط المعلومات اللازمة لتقديم تجربة مواعدة آمنة ومخصصة. يتم تخزين بياناتك بأمان ولا يتم بيعها أبدًا لأطراف ثالثة. تتحكم فيما تشاركه ومع من. باستخدام Muirl، فإنك توافق على استخدامنا لمعلوماتك بما يتماشى مع هذه السياسة لتعزيز تجربتك وسلامتك.`,
      },
      {
        contentType: staticContent.termsCondition,
        title: "Terms and Condition",
        title_ar: "الشروط والأحكام",
        description: `Welcome to Muirl! By using our app, you agree to the following terms:
Eligibility: You must be 18 years or older to use Muirl.
Account Responsibility: Keep your login details secure. You're responsible for all activity under your account.
Content: You may not post harmful, offensive, or fake content. Muirl reserves the right to remove any content or suspend users violating our policies.
Privacy: We protect your data as outlined in our Privacy Policy.
Conduct: Respect others. Harassment, abuse, or discrimination of any kind is strictly prohibited.
Termination: We may suspend or terminate your account if you violate these terms.`,
        description_ar: `مرحبًا بك في Muirl! باستخدام تطبيقنا، فإنك توافق على الشروط التالية:
الأهلية: يجب أن تكون 18 عامًا أو أكثر لاستخدام Muirl.
مسؤولية الحساب: احتفظ بتفاصيل تسجيل الدخول الخاصة بك بأمان. أنت مسؤول عن جميع الأنشطة التي تتم تحت حسابك.
المحتوى: لا يجوز لك نشر محتوى ضار أو مسيء أو زائف. يحتفظ Muirl بالحق في إزالة أي محتوى أو تعليق حسابات المستخدمين المخالفين.
الخصوصية: نحن نحمي بياناتك كما هو موضح في سياسة الخصوصية الخاصة بنا.
السلوك: احترم الآخرين. يُحظر التحرش أو الإساءة أو التمييز من أي نوع.
إنهاء الحساب: يجوز لنا تعليق أو إنهاء حسابك إذا انتهكت هذه الشروط.`,
      },
      {
        contentType: staticContent.faq,
        title: "FAQ",
        title_ar: "الأسئلة الشائعة",
        question: "1. How does Muirl match people?",
        question_ar: "1. كيف يقوم Muirl بربط الأشخاص؟",
        answer: "Muirl uses shared interests, location, and profile preferences to help you connect with like-minded people genuinely.",
        answer_ar: "يستخدم Muirl الاهتمامات المشتركة والموقع وتفضيلات الملف الشخصي لمساعدتك على التواصل مع أشخاص مشابهين لاهتماماتك بشكل حقيقي.",
      },
      {
        contentType: staticContent.faq,
        title: "FAQ",
        title_ar: "الأسئلة الشائعة",
        question: "2. Is Muirl free to use?",
        question_ar: "2. هل استخدام Muirl مجاني؟",
        answer: "Yes, Muirl is free to use with optional premium features to enhance your experience.",
        answer_ar: "نعم، Muirl مجاني للاستخدام مع ميزات مميزة اختيارية لتعزيز تجربتك.",
      },
      {
        contentType: staticContent.faq,
        title: "FAQ",
        title_ar: "الأسئلة الشائعة",
        question: "3. How do I report someone?",
        question_ar: "3. كيف يمكنني الإبلاغ عن شخص ما؟",
        answer: "You can report any user by visiting their profile and tapping the 'Report' option. We take safety seriously.",
        answer_ar: "يمكنك الإبلاغ عن أي مستخدم من خلال زيارة ملفه الشخصي والنقر على خيار 'الإبلاغ'. نحن نأخذ الأمان على محمل الجد.",
      },
      {
        contentType: staticContent.faq,
        title: "FAQ",
        title_ar: "الأسئلة الشائعة",
        question: "4. Is my data safe?",
        question_ar: "4. هل بياناتي آمنة؟",
        answer: "Absolutely. We prioritize your privacy and never share your info without consent.",
        answer_ar: "بالتأكيد. نحن نعطي الأولوية لخصوصيتك ولا نشارك معلوماتك أبدًا بدون موافقتك.",
      },
    ];

    const inserted = await StaticContent.insertMany(staticData);
    console.log("📥 Default static content inserted:", inserted.length);
  } catch (err) {
    console.error("❌ Error initializing static content:", err);
  }
};

initializeStaticContent();
