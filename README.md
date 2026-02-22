# 🚗 Auto-Hunter EU

**Auto-Hunter EU** is a high-performance car aggregator and AI-discovery platform designed for the European market. It helps users find the best car deals across multiple countries by aggregating data from top platforms like Otomoto (Poland), Autovit (Romania), and more.

## ✨ Features

- **🌐 Multi-Country Aggregation**: Real-time scraping from Poland, Romania, Bulgaria, and Moldova.
- **🤖 AI-Powered Insights**: Leveraging Google Gemini 1.5 Flash to provide:
  - Value for money scores.
  - Pros & Cons summaries.
  - Personalized car recommendations.
- **⚡ Smart Search**: Intuitive filters for price, fuel type, mileage, and year.
- **📱 Responsive Design**: A premium, centered interface built with Tailwind CSS and Radix UI.
- **🔐 Secure Auth**: Integration with Supabase and GitHub for user accounts and favorites.

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS, Lucide React, Shadcn UI
- **Backend/DB**: Supabase (PostgreSQL)
- **AI**: Google Generative AI (Gemini 1.5 Flash)
- **State Management**: TanStack Query (React Query)

## 🚀 Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Br1zz1713/AI_assistant_car_dealer.git
    cd AI_assistant_car_dealer
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up environment variables**:
    Create a `.env.local` file based on [ENV_GUIDE.md](ENV_GUIDE.md):
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=your_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
    GOOGLE_GEMINI_API_KEY=your_gemini_key
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📖 Documentation

- [Environment Variables Guide](ENV_GUIDE.md)
- [Project Architecture (TBD)]
