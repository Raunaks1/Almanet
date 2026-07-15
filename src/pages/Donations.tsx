import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, TrendingUp, Users, GraduationCap, CreditCard } from 'lucide-react';

const Donations: React.FC = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<string>('5000');
  const [customAmount, setCustomAmount] = useState<string>('');

  const handleDonate = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = amount === 'custom' ? customAmount : amount;
    if (!finalAmount || isNaN(Number(finalAmount)) || Number(finalAmount) <= 0) {
      alert('Please enter a valid donation amount.');
      return;
    }
    alert(`Thank you for initiating a generous donation of ₹${finalAmount}! You will now be redirected to the payment gateway. (Mock)`);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{ padding: '1.5rem 2rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Heart size={24} color="#ef4444" fill="#ef4444" /> Give Back
        </h1>
      </header>

      <main className="container" style={{ padding: '3rem 1.5rem', maxWidth: '1200px', width: '100%', display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
        
        {/* Left Side: Impact & Story */}
        <div style={{ flex: '1 1 500px' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem', background: 'linear-gradient(to right, #ef4444, var(--brand-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.2 }}>
            Empower the Next Generation
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
            Your contributions directly support student scholarships, campus infrastructure upgrades, and research grants. Join your fellow alumni in leaving a lasting legacy.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <GraduationCap size={24} />
              </div>
              <h3 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>50+</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Scholarships Funded</p>
            </div>
            
            <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <TrendingUp size={24} />
              </div>
              <h3 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>₹1.2Cr</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Raised this year</p>
            </div>
          </div>
        </div>

        {/* Right Side: Donation Form */}
        <div style={{ flex: '1 1 400px' }}>
          <div className="glass-panel" style={{ padding: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Make a Contribution</h2>
            
            <form onSubmit={handleDonate}>
              <div style={{ marginBottom: '2rem' }}>
                <label className="input-label" style={{ marginBottom: '1rem' }}>Select Amount</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {['1000', '5000', '10000', '25000'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => { setAmount(val); setCustomAmount(''); }}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        background: amount === val ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-tertiary)',
                        border: amount === val ? '1px solid #ef4444' : '1px solid var(--border-color)',
                        color: amount === val ? '#ef4444' : 'var(--text-primary)',
                        fontSize: '1.125rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
                
                <div style={{ marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setAmount('custom')}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      background: amount === 'custom' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-tertiary)',
                      border: amount === 'custom' ? '1px solid #ef4444' : '1px solid var(--border-color)',
                      color: amount === 'custom' ? '#ef4444' : 'var(--text-primary)',
                      fontSize: '1rem',
                      cursor: 'pointer'
                    }}
                  >
                    Custom Amount
                  </button>
                </div>
              </div>

              {amount === 'custom' && (
                <div className="input-group animate-fade-in" style={{ marginBottom: '2rem' }}>
                  <label className="input-label">Enter Custom Amount (₹)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="e.g. 50000" 
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    min="1"
                    required
                  />
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.125rem', background: '#ef4444', color: 'white', border: 'none' }}>
                <CreditCard size={20} /> Proceed to Pay
              </button>
              
              <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                Secure payment processing. Donations are tax-deductible under section 80G.
              </p>
            </form>
          </div>
        </div>

      </main>
    </div>
  );
};

export default Donations;
