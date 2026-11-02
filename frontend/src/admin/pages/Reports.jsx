import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';

export default function Reports() {
  return (
    <div className="admin-page">
      <PageHeader title="Reports" subtitle="Platform analytics and reports" />

      <div className="stats-grid">
        <StatCard 
          title="Today's Revenue" 
          value="$24,580" 
          sub="+12.5% from yesterday" 
          color="green"
          icon={
            <svg className="stat-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard 
          title="This Week" 
          value="$156,340" 
          sub="+8.2% from last week" 
          color="blue"
          icon={
            <svg className="stat-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <StatCard 
          title="This Month" 
          value="$687,920" 
          sub="+15.3% from last month" 
          color="purple"
          icon={
            <svg className="stat-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <StatCard 
          title="Total Revenue" 
          value="$2,847,650" 
          sub="All time earnings" 
          color="cyan"
          icon={
            <svg className="stat-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
      </div>

      <div className="admin-card">
        <div className="card-header">
          <h3 className="card-title">Platform Statistics</h3>
        </div>
        <div className="reports-content">
          <div className="report-section">
            <h4 className="report-section-title">User Growth</h4>
            <p className="report-section-text">Total registrations increased by 23% this month with 287 new users joining the platform.</p>
          </div>
          <div className="report-section">
            <h4 className="report-section-title">Trading Volume</h4>
            <p className="report-section-text">Total trading volume reached $4.2M this month, marking a 31% increase from the previous period.</p>
          </div>
          <div className="report-section">
            <h4 className="report-section-title">Investment Activity</h4>
            <p className="report-section-text">567 active investments with an average ROI of 8.5% across all plans.</p>
          </div>
          <div className="report-section">
            <h4 className="report-section-title">Support Performance</h4>
            <p className="report-section-text">Average ticket resolution time: 4.2 hours. 94% customer satisfaction rate.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
