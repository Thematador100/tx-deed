import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Code, Database, Terminal, Key, Server, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const CodeBlock = ({ children, lang }) => (
  <div className="bg-slate-800 rounded-lg overflow-hidden my-4">
    <div className="bg-slate-900 text-slate-300 px-4 py-2 text-sm font-semibold flex justify-between items-center">
      <span>{lang}</span>
      <button onClick={() => navigator.clipboard.writeText(children)} className="text-xs hover:text-white">Copy</button>
    </div>
    <pre className="p-4 text-sm text-white overflow-x-auto"><code>{children}</code></pre>
  </div>
);

const DeveloperHub = () => {
  const pythonCode = `
from supabase import create_client, Client
import os

# Use environment variables for your keys
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

# Example property data from your scraper
new_property = {
    "address": "123 Main St, Anytown, USA 12345",
    "price": 5000,
    "estimated_value": 50000,
    "auction_date": "2025-10-15",
    "status": "upcoming",
    "roi": 900,
    "bedrooms": 3,
    "bathrooms": 2,
    "sqft": 1500,
    "lot_size": "0.25 acres",
    "year_built": 1985,
    "property_type": "Single Family",
    "description": "A charming single-family home.",
    "image_url": "https://example.com/image.jpg",
    "listing_type": "auction",
    "deal_stage": "Researching",
    "opportunity_score": 85
}

# Insert the data into the 'properties' table
data, error = supabase.table('properties').insert(new_property).execute()

if error:
    print("Error inserting data:", error)
else:
    print("Successfully inserted data:", data)
  `;

  const nodeCode = `
import { createClient } from '@supabase/supabase-js'

// Use environment variables for your keys
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Example property data from your scraper
const newProperty = {
    address: "456 Oak Ave, Sometown, USA 54321",
    price: 7500,
    estimated_value: 80000,
    auction_date: "2025-11-01",
    status: "upcoming",
    roi: 966,
    property_type: "Vacant Land",
    listing_type: "auction",
    deal_stage: "Researching",
    opportunity_score: 92
}

async function insertProperty() {
    const { data, error } = await supabase
        .from('properties')
        .insert([newProperty])
        .select()

    if (error) {
        console.error('Error inserting data:', error)
        return
    }
    console.log('Successfully inserted data:', data)
}

insertProperty()
  `;

  const handleRequestAccess = () => {
    toast({
      title: "Access Request Sent",
      description: "Our enterprise team will be in touch with you shortly.",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Helmet>
        <title>Developer Hub - Win With Deeds</title>
        <meta name="description" content="Integrate your custom tools and scrapers with the Win With Deeds platform using our API guidelines." />
      </Helmet>
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 flex items-center justify-center">
              <Terminal className="w-12 h-12 mr-4 text-purple-600" /> Developer & API Hub
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
              Connect your scrapers, external tools, and enterprise systems to the Win With Deeds platform.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center"><Key className="w-6 h-6 mr-3 text-indigo-600" />1. Authentication</h2>
                <p className="text-slate-700 mb-4">Your backend scripts will need to authenticate with our Supabase backend. Use your project's <code className="bg-slate-100 text-red-600 p-1 rounded text-sm">SUPABASE_URL</code> and <code className="bg-slate-100 text-red-600 p-1 rounded text-sm">SUPABASE_SERVICE_ROLE_KEY</code>. These are available in your project's Supabase dashboard and should be stored as secure environment variables in your scraping server.</p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center"><Database className="w-6 h-6 mr-3 text-indigo-600" />2. Target Table: `properties`</h2>
                <p className="text-slate-700 mb-4">All individual property leads should be inserted into the <code className="bg-slate-100 text-red-600 p-1 rounded text-sm">public.properties</code> table. The table has the following key columns:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 bg-slate-50 p-4 rounded-lg border">
                  <li><code className="font-mono">address</code> (text, required)</li>
                  <li><code className="font-mono">price</code> (numeric, required)</li>
                  <li><code className="font-mono">estimated_value</code> (numeric, required)</li>
                  <li><code className="font-mono">auction_date</code> (date, required)</li>
                  <li><code className="font-mono">property_type</code> (text)</li>
                  <li><code className="font-mono">listing_type</code> (text, required, e.g., 'auction')</li>
                  <li><code className="font-mono">opportunity_score</code> (integer)</li>
                  <li>... and other fields like <code className="font-mono">bedrooms</code>, <code className="font-mono">bathrooms</code>, <code className="font-mono">sqft</code>, etc.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center"><Code className="w-6 h-6 mr-3 text-indigo-600" />3. Example Code</h2>
                <p className="text-slate-700 mb-4">Here are examples of how to insert a new property using Python and Node.js.</p>
                
                <h3 className="font-semibold text-lg text-slate-800 mt-6">Python Example</h3>
                <CodeBlock lang="python">{pythonCode}</CodeBlock>

                <h3 className="font-semibold text-lg text-slate-800 mt-6">Node.js Example</h3>
                <CodeBlock lang="javascript">{nodeCode}</CodeBlock>
              </section>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-b from-slate-800 to-slate-900 text-white p-8 rounded-2xl shadow-2xl">
                <h3 className="text-2xl font-bold mb-4 flex items-center"><Server className="w-6 h-6 mr-3" /> Data-as-a-Service API</h3>
                <p className="text-slate-300 mb-6">Power your own applications with our cleaned, enriched, and standardized tax deed data. We offer a high-ticket API subscription for institutional buyers, hedge funds, and other prop-tech companies.</p>
                <ul className="space-y-3 text-slate-300 text-sm mb-6">
                  <li className="flex items-center"><Briefcase className="w-4 h-4 mr-2 text-indigo-400" /> Enterprise-grade uptime</li>
                  <li className="flex items-center"><Database className="w-4 h-4 mr-2 text-indigo-400" /> Access to historical data</li>
                  <li className="flex items-center"><Key className="w-4 h-4 mr-2 text-indigo-400" /> Dedicated support</li>
                </ul>
                <Button onClick={handleRequestAccess} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white">Request Enterprise Access</Button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default DeveloperHub;