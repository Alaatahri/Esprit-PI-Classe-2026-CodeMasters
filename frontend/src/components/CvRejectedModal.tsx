// DESIGN ONLY - Thème dark BMP.tn

interface CvRejectedModalProps {
  isOpen: boolean;
  result: {
    score: number;
    missingSkills: string[];
    presentSkills: string[];
    feedback: string;
  };
  onModify: () => void;
}

export function CvRejectedModal({
  isOpen,
  result,
  onModify,
}: CvRejectedModalProps) {
  if (!isOpen) return null;

  const missingSkills = Array.isArray(result.missingSkills)
    ? result.missingSkills
    : [];
  const presentSkills = Array.isArray(result.presentSkills)
    ? result.presentSkills
    : [];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Inscription refusée"
    >
      <div
        style={{
          background: '#141420',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 4px 32px rgba(239,68,68,0.15)',
        }}
      >
        {/* Header erreur */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              flexShrink: 0,
            }}
            aria-hidden
          >
            ✗
          </div>
          <div>
            <h3
              style={{
                color: '#F0F0FF',
                fontSize: '18px',
                fontWeight: 700,
                margin: 0,
              }}
            >
              Inscription refusée
            </h3>
            <p
              style={{
                color: '#EF4444',
                fontSize: '13px',
                margin: '3px 0 0',
                fontWeight: 500,
              }}
            >
              Votre CV ne répond pas aux critères requis pour être expert sur BMP.tn
            </p>
          </div>
        </div>

        {/* Score */}
        <div
          style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <span
              style={{
                color: '#8888AA',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              Score de compétences BTP
            </span>
            <span
              style={{
                color: '#EF4444',
                fontSize: '15px',
                fontWeight: 700,
              }}
            >
              {result.score}/100
            </span>
          </div>
          {/* Barre score */}
          <div
            style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '9999px',
              height: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.max(0, Math.min(100, Number(result.score) || 0))}%`,
                height: '100%',
                background: '#EF4444',
                borderRadius: '9999px',
              }}
            />
          </div>
          <p
            style={{
              color: '#8888AA',
              fontSize: '12px',
              margin: '8px 0 0',
            }}
          >
            Minimum requis : 40/100
          </p>
        </div>

        {/* Feedback */}
        <p
          style={{
            color: '#8888AA',
            fontSize: '14px',
            lineHeight: '1.6',
            marginBottom: '20px',
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          💬 {result.feedback ?? ""}
        </p>

        {/* Compétences manquantes */}
        {missingSkills.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <p
              style={{
                color: '#EF4444',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                marginBottom: '10px',
              }}
            >
              ✗ Compétences manquantes
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              {missingSkills.map((skill, i) => (
                <span
                  key={i}
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: '#EF4444',
                    borderRadius: '9999px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Compétences présentes */}
        {presentSkills.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <p
              style={{
                color: '#10B981',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                marginBottom: '10px',
              }}
            >
              ✓ Compétences détectées
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              {presentSkills.map((skill, i) => (
                <span
                  key={i}
                  style={{
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    color: '#10B981',
                    borderRadius: '9999px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* UN SEUL bouton — Modifier CV */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '20px',
          }}
        >
          <button
            onClick={onModify}
            style={{
              width: '100%',
              padding: '12px',
              background: '#F5A623',
              border: 'none',
              borderRadius: '10px',
              color: '#080810',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            📎 Modifier mon CV et réessayer
          </button>
          <p
            style={{
              color: '#55556A',
              fontSize: '12px',
              textAlign: 'center',
              marginTop: '12px',
            }}
          >
            Vous devez soumettre un CV avec les compétences BTP requises pour vous
            inscrire en tant qu&apos;expert.
          </p>
        </div>
      </div>
    </div>
  );
}

