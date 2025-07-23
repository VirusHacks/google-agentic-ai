"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Users,
  GraduationCap,
  ArrowRight,
  Loader2,
  CheckCircle,
  Star,
  MessageSquare,
  BarChart3,
  Globe,
  Brain,
  FileText,
  Video,
  Mail,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const scaleOnHover = {
  whileHover: { scale: 1.05 },
  transition: { type: "spring", stiffness: 300 },
}

export default function HomePage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && userProfile) {
      const dashboardPath = userProfile.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard"
      router.push(dashboardPath)
    }
  }, [user, userProfile, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (user && userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div className="flex items-center space-x-2" whileHover={{ scale: 1.05 }}>
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Classroom Assistant</span>
            </motion.div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="hover:bg-blue-50">
                  Sign In
                </Button>
              </Link>
              <Link href="/login">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm bg-blue-100 text-blue-700 border-blue-200">
                🚀 AI-Powered Education Platform
              </Badge>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Transform Your
              <motion.span
                className="text-blue-600 block"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                Classroom Experience
              </motion.span>
            </motion.h1>

            <motion.p
              className="text-xl text-gray-600 max-w-4xl mx-auto mb-10 leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Empower teachers and students with cutting-edge AI tools, seamless classroom management, and personalized
              learning experiences. Join thousands of educators revolutionizing education.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link href="/login">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="w-full sm:w-auto px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700">
                    Start Teaching Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="/login">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto px-8 py-4 text-lg border-2 hover:bg-blue-50 bg-transparent"
                  >
                    Join as Student
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            <motion.div
              className="mt-16 flex items-center justify-center space-x-8 text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Setup in 2 minutes</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-20" {...fadeInUp}>
            <Badge variant="outline" className="mb-4 px-4 py-2 text-blue-600 border-blue-200">
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need for Modern Education
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Comprehensive tools designed for both teachers and students to enhance learning outcomes and streamline
              classroom management.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Users,
                title: "Smart Classroom Management",
                description:
                  "Create and manage virtual classrooms with advanced analytics, student progress tracking, and automated attendance systems.",
                color: "blue",
                gradient: "from-blue-500 to-blue-600",
              },
              {
                icon: Brain,
                title: "AI-Powered Learning",
                description:
                  "Leverage artificial intelligence for personalized tutoring, automated grading, and intelligent content recommendations.",
                color: "purple",
                gradient: "from-purple-500 to-purple-600",
              },
              {
                icon: FileText,
                title: "Assignment Hub",
                description:
                  "Create, distribute, and grade assignments with real-time collaboration, plagiarism detection, and instant feedback.",
                color: "green",
                gradient: "from-green-500 to-green-600",
              },
              {
                icon: BarChart3,
                title: "Advanced Analytics",
                description:
                  "Gain insights into student performance with detailed reports, learning patterns, and predictive analytics.",
                color: "orange",
                gradient: "from-orange-500 to-orange-600",
              },
              {
                icon: Video,
                title: "Interactive Content",
                description:
                  "Create engaging multimedia lessons with video integration, interactive quizzes, and gamification elements.",
                color: "red",
                gradient: "from-red-500 to-red-600",
              },
              {
                icon: Globe,
                title: "Global Accessibility",
                description:
                  "Access your classroom from anywhere with multi-language support, offline capabilities, and cross-platform sync.",
                color: "teal",
                gradient: "from-teal-500 to-teal-600",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                  <CardContent className="p-8">
                    <motion.div
                      className={`h-16 w-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <feature.icon className="h-8 w-8 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-20" {...fadeInUp}>
            <Badge variant="outline" className="mb-4 px-4 py-2 text-blue-600 border-blue-200">
              How It Works
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Get Started in Three Simple Steps</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From setup to success, we've made it incredibly easy to transform your teaching experience.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-12"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                step: "01",
                title: "Create Your Account",
                description:
                  "Sign up as a teacher or student in under 2 minutes. Choose your role and set up your profile with our guided onboarding process.",
                icon: Users,
              },
              {
                step: "02",
                title: "Set Up Your Classroom",
                description:
                  "Create virtual classrooms, invite students, and customize your learning environment with our intuitive classroom builder.",
                icon: BookOpen,
              },
              {
                step: "03",
                title: "Start Teaching & Learning",
                description:
                  "Begin creating assignments, sharing resources, and tracking progress with our comprehensive suite of educational tools.",
                icon: GraduationCap,
              },
            ].map((step, index) => (
              <motion.div key={index} variants={fadeInUp} className="text-center">
                <motion.div
                  className="relative mb-8"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="h-24 w-24 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
                    <step.icon className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-8 w-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-blue-100">
                    <span className="text-sm font-bold text-blue-600">{step.step}</span>
                  </div>
                </motion.div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-20" {...fadeInUp}>
            <Badge variant="outline" className="mb-4 px-4 py-2 text-blue-600 border-blue-200">
              Impact
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Trusted by Educators Worldwide</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of teachers and students who have transformed their educational experience.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              { number: "50K+", label: "Active Teachers", icon: Users },
              { number: "500K+", label: "Students Enrolled", icon: GraduationCap },
              { number: "1M+", label: "Assignments Created", icon: FileText },
              { number: "98%", label: "Satisfaction Rate", icon: Star },
            ].map((stat, index) => (
              <motion.div key={index} variants={fadeInUp} className="text-center" whileHover={{ scale: 1.05 }}>
                <motion.div
                  className="h-16 w-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <stat.icon className="h-8 w-8 text-white" />
                </motion.div>
                <div className="text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-20" {...fadeInUp}>
            <Badge variant="outline" className="mb-4 px-4 py-2 text-blue-600 border-blue-200">
              Testimonials
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">What Educators Are Saying</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real stories from teachers and students who have experienced the transformation.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                quote:
                  "Classroom Assistant has revolutionized how I manage my classes. The AI-powered tools save me hours every week, and my students are more engaged than ever.",
                author: "Sarah Johnson",
                role: "High School Math Teacher",
                rating: 5,
              },
              {
                quote:
                  "As a student, I love how organized everything is. I can easily track my assignments, get instant feedback, and the AI tutor helps me understand complex concepts.",
                author: "Michael Chen",
                role: "University Student",
                rating: 5,
              },
              {
                quote:
                  "The analytics dashboard gives me incredible insights into my students' progress. I can identify struggling students early and provide targeted support.",
                author: "Dr. Emily Rodriguez",
                role: "Elementary School Principal",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white">
                  <CardContent className="p-8">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <blockquote className="text-gray-700 mb-6 leading-relaxed italic">"{testimonial.quote}"</blockquote>
                    <div className="flex items-center">
                      <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4">
                        <span className="text-white font-bold text-lg">
                          {testimonial.author
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{testimonial.author}</div>
                        <div className="text-gray-600 text-sm">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600 opacity-90"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Badge variant="secondary" className="mb-6 px-4 py-2 bg-blue-100 text-blue-700">
              Ready to Get Started?
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Transform Your Teaching Today</h2>
            <p className="text-xl text-blue-100 mb-10 leading-relaxed">
              Join thousands of educators already using Classroom Assistant to enhance their teaching experience and
              improve student outcomes.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/login">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full sm:w-auto px-8 py-4 text-lg bg-white text-blue-600 hover:bg-gray-100"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="/login">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto px-8 py-4 text-lg border-2 border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
                  >
                    Schedule Demo
                  </Button>
                </motion.div>
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center space-x-8 text-sm text-blue-100">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeInUp} className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <BookOpen className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold">Classroom Assistant</span>
              </div>
              <p className="text-gray-400 max-w-md mb-6 leading-relaxed">
                Empowering educators and students with AI-powered tools for better learning outcomes and seamless
                classroom management.
              </p>
              <div className="flex space-x-4">
                {[Mail, MessageSquare, Globe].map((Icon, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.2 }}
                    className="h-10 w-10 bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <h3 className="font-bold mb-6 text-lg">Product</h3>
              <ul className="space-y-3 text-gray-400">
                {["Features", "Pricing", "API", "Integrations", "Support"].map((item) => (
                  <li key={item}>
                    <Link href="/login" className="hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <h3 className="font-bold mb-6 text-lg">Company</h3>
              <ul className="space-y-3 text-gray-400">
                {["About", "Blog", "Careers", "Contact", "Privacy"].map((item) => (
                  <li key={item}>
                    <Link href="/login" className="hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>

          <motion.div
            className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <p className="text-gray-400 text-sm">© 2024 Classroom Assistant. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {["Terms", "Privacy", "Cookies"].map((item) => (
                <Link key={item} href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">
                  {item}
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}
