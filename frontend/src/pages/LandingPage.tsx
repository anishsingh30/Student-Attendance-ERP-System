import React, { useState, useEffect } from 'react';
import { LandingHeader } from '../components/landing/LandingHeader';
import { HeroSection } from '../components/landing/HeroSection';
import { CapabilityStrip } from '../components/landing/CapabilityStrip';
import { SystemOverview } from '../components/landing/SystemOverview';
import { FeatureGrid } from '../components/landing/FeatureGrid';
import { HowItWorks } from '../components/landing/HowItWorks';
import { RolePortals } from '../components/landing/RolePortals';
import { IntelligenceSection } from '../components/landing/IntelligenceSection';
import { SecuritySection } from '../components/landing/SecuritySection';
import { FinalCTA } from '../components/landing/FinalCTA';
import { LandingFooter } from '../components/landing/LandingFooter';
import { api } from '../api/client';
import { PublicLandingStats } from '../types';

export const LandingPage: React.FC = () => {
  const [stats, setStats] = useState<PublicLandingStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchLandingData = async () => {
      try {
        const data = await api.getPublicLandingStats();
        if (isMounted) {
          setStats(data);
        }
      } catch (err) {
        // Graceful fallback if backend is offline or starting
        console.warn('Public landing stats fetch notice:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLandingData();
    return () => {
      isMounted = false;
    };
  }, []);

  const statutoryThreshold = stats?.thresholds?.statutory_minimum ?? 75;

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-black text-slate-900 dark:text-white flex flex-col selection:bg-blue-100 selection:text-blue-900 font-sans">
      
      {/* Institutional Sticky Header */}
      <LandingHeader />

      {/* Main Landing Sections */}
      <main className="flex-1">
        
        {/* 1. Hero Section with Interactive Miniature Product Visual */}
        <HeroSection statutoryThreshold={statutoryThreshold} />

        {/* 2. Concise Product Capability Strip */}
        <CapabilityStrip />

        {/* 3. Institutional Purpose & Dynamic System Metrics Overview */}
        <SystemOverview stats={stats} loading={loading} />

        {/* 4. Core Enterprise Capabilities Grid */}
        <FeatureGrid />

        {/* 5. 6-Step Visual Recovery & Evaluation Pipeline */}
        <HowItWorks />

        {/* 6. Role-Based Access Portals (Student, Faculty, Administrator) */}
        <RolePortals />

        {/* 7. Dual Engine: Deterministic Arithmetic vs AI Assistant */}
        <IntelligenceSection />

        {/* 8. Institutional Security & Compliance Architecture */}
        <SecuritySection />

        {/* 9. Final Call to Action */}
        <FinalCTA />

      </main>

      {/* Institutional Footer */}
      <LandingFooter />

    </div>
  );
};
