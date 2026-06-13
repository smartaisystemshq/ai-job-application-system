import React, { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { t } from '../translations';

const PLACEHOLDER_NAME = '[DEIN VOLLSTÄNDIGER NAME]';
const PLACEHOLDER_CITY = '[DEIN ORT]';

function Placeholder({ text }) {
  return <span style={{ color: '#f87171', fontWeight: 600 }}>{text}</span>;
}

function LegalSection({ children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14,
      padding: '32px',
      fontSize: 13,
      color: 'rgba(226,237,232,0.55)',
      lineHeight: 1.8,
    }}>
      {children}
    </div>
  );
}

function H({ children }) {
  return (
    <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2ede8', marginTop: 24, marginBottom: 8, lineHeight: 1.4 }}>
      {children}
    </h3>
  );
}

function H1({ children }) {
  return (
    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2ede8', marginTop: 0, marginBottom: 16, lineHeight: 1.3 }}>
      {children}
    </h2>
  );
}

function A({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#1D9E75', textDecoration: 'underline' }}>
      {children}
    </a>
  );
}

function P({ children, style }) {
  return <p style={{ margin: '0 0 10px', ...style }}>{children}</p>;
}

function ImpressumContent() {
  return (
    <LegalSection>
      <H1>Impressum</H1>
      <P>Angaben gemäß § 5 ECG (E-Commerce-Gesetz)</P>
      <P>
        <Placeholder text={PLACEHOLDER_NAME} /><br />
        [DEINE STRASSE UND HAUSNUMMER]<br />
        [PLZ ORT]<br />
        Österreich
      </P>
      <P>E-Mail: <A href="mailto:smartaisystemshq@gmail.com">smartaisystemshq@gmail.com</A></P>
      <P style={{ fontStyle: 'italic', color: 'rgba(226,237,232,0.4)' }}>
        Hinweis: Diese Website wird privat betrieben. Für eine rechtsgültige Kontaktaufnahme verwenden Sie bitte ausschließlich die oben angegebene E-Mail-Adresse.
      </P>
      <H>Online-Streitbeilegung</H>
      <P>
        Plattform der EU-Kommission zur Online-Streitbeilegung:{' '}
        <A href="https://ec.europa.eu/consumers/odr">https://ec.europa.eu/consumers/odr</A>
      </P>
      <div style={{ marginTop: 24, padding: '12px 16px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, fontSize: 12, color: '#f87171' }}>
        ⚠ Bitte ersetze vor der Veröffentlichung: <strong>DEIN VOLLSTÄNDIGER NAME</strong>, <strong>DEINE STRASSE UND HAUSNUMMER</strong>, <strong>PLZ ORT</strong>
      </div>
    </LegalSection>
  );
}

function DatenschutzContent() {
  return (
    <LegalSection>
      <H1>Datenschutzerklärung</H1>

      <H>1. Allgemeines</H>
      <P>Der Schutz Ihrer persönlichen Daten ist uns ein wichtiges Anliegen. Diese Datenschutzerklärung informiert Sie darüber, welche Daten wir erheben, wie wir sie verwenden und welche Rechte Sie haben.</P>

      <H>2. Verantwortlicher</H>
      <P>Verantwortlicher im Sinne der DSGVO ist:<br /><Placeholder text={PLACEHOLDER_NAME} /><br />E-Mail: <A href="mailto:smartaisystemshq@gmail.com">smartaisystemshq@gmail.com</A></P>

      <H>3. Welche Daten werden verarbeitet?</H>

      <P><strong style={{ color: '#e2ede8' }}>a) CV und Bewerbungsdaten</strong><br />
      Wenn Sie den CV Optimizer, den Anschreiben-Generator, die Interview-Vorbereitung oder den CV Builder nutzen, laden Sie Ihren Lebenslauf und Stellenbeschreibungen hoch. Diese Daten werden ausschließlich zur Verarbeitung durch die KI (Claude API von Anthropic) verwendet und unmittelbar danach gelöscht. Wir speichern keine CV-Inhalte, Stellenbeschreibungen oder persönliche Bewerbungsdaten auf unseren Servern.</P>

      <P><strong style={{ color: '#e2ede8' }}>b) Lokale Speicherung (localStorage)</strong><br />
      Zur Verbesserung der Benutzerfreundlichkeit speichert die App Ihre Eingaben temporär in Ihrem Browser (localStorage). Diese Daten verlassen Ihren Browser nicht und werden nicht an uns übertragen. Sie können diese Daten jederzeit durch Löschen des Browser-Caches entfernen.</P>

      <P><strong style={{ color: '#e2ede8' }}>c) Zugangscode</strong><br />
      Ihr Zugangscode wird ausschließlich lokal in Ihrem Browser gespeichert, um Ihren Zugang dauerhaft zu erhalten. Er wird nicht auf unseren Servern gespeichert.</P>

      <P><strong style={{ color: '#e2ede8' }}>d) Zahlungsdaten</strong><br />
      Zahlungen werden ausschließlich über Gumroad abgewickelt. Wir haben keinen Zugriff auf Ihre Zahlungsdaten. Es gelten die Datenschutzbestimmungen von Gumroad: <A href="https://gumroad.com/privacy">https://gumroad.com/privacy</A></P>

      <P><strong style={{ color: '#e2ede8' }}>e) E-Mail-Kontakt</strong><br />
      Wenn Sie uns per E-Mail kontaktieren, werden Ihre Angaben zur Bearbeitung der Anfrage gespeichert. Wir geben diese Daten nicht an Dritte weiter.</P>

      <H>4. Drittanbieter — Anthropic (Claude API)</H>
      <P>Zur KI-Verarbeitung Ihrer Dokumente verwenden wir die API von Anthropic, Inc. (USA). Die übermittelten Daten werden von Anthropic gemäß deren Datenschutzrichtlinien verarbeitet: <A href="https://www.anthropic.com/privacy">https://www.anthropic.com/privacy</A></P>

      <H>5. Keine Cookies</H>
      <P>Wir verwenden keine Tracking-Cookies oder Analyse-Tools. Es werden keine Daten für Werbezwecke erhoben.</P>

      <H>6. Ihre Rechte (DSGVO)</H>
      <P>Sie haben das Recht auf:</P>
      <div style={{ paddingLeft: 16, marginBottom: 10 }}>
        <P>— Auskunft über Ihre gespeicherten Daten (Art. 15 DSGVO)</P>
        <P>— Berichtigung unrichtiger Daten (Art. 16 DSGVO)</P>
        <P>— Löschung Ihrer Daten (Art. 17 DSGVO)</P>
        <P>— Einschränkung der Verarbeitung (Art. 18 DSGVO)</P>
        <P>— Datenübertragbarkeit (Art. 20 DSGVO)</P>
        <P>— Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</P>
      </div>
      <P>Zur Ausübung Ihrer Rechte kontaktieren Sie uns unter: <A href="mailto:smartaisystemshq@gmail.com">smartaisystemshq@gmail.com</A></P>

      <H>7. Beschwerderecht</H>
      <P>Sie haben das Recht, sich bei der österreichischen Datenschutzbehörde zu beschweren:<br />
      Datenschutzbehörde<br />
      Barichgasse 40-42<br />
      1030 Wien<br />
      <A href="mailto:dsb@dsb.gv.at">dsb@dsb.gv.at</A></P>

      <H>8. Änderungen dieser Datenschutzerklärung</H>
      <P>Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf zu aktualisieren. Die aktuelle Version ist stets auf dieser Seite abrufbar.</P>

      <P style={{ color: 'rgba(226,237,232,0.3)', fontSize: 12, marginTop: 24 }}>Stand: Juni 2025</P>

      <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, fontSize: 12, color: '#f87171' }}>
        ⚠ Bitte ersetze vor der Veröffentlichung: <strong><Placeholder text={PLACEHOLDER_NAME} /></strong>
      </div>
    </LegalSection>
  );
}

function AgbContent() {
  return (
    <LegalSection>
      <H1>Allgemeine Geschäftsbedingungen (AGB)</H1>

      <H>1. Geltungsbereich</H>
      <P>Diese AGB gelten für alle Käufe und die Nutzung des AI Job Application System, betrieben von <Placeholder text={PLACEHOLDER_NAME} /> (nachfolgend "Anbieter").</P>

      <H>2. Vertragsgegenstand</H>
      <P>Der Anbieter stellt eine webbasierte KI-Anwendung zur Verfügung, die Nutzern hilft, Bewerbungsunterlagen (Lebenslauf, Anschreiben, Interviewvorbereitung) mithilfe von KI zu optimieren.</P>

      <H>3. Zugang und Nutzung</H>
      <P>Nach einmaligem Kauf über Gumroad erhalten Sie einen persönlichen Zugangscode. Dieser Code gewährt Ihnen unbegrenzten Zugang zur Anwendung. Der Code ist nicht übertragbar und darf nicht weitergegeben werden.</P>

      <H>4. Preise und Zahlung</H>
      <P>Der Kaufpreis beträgt einmalig €27 (inkl. etwaiger Steuern). Die Zahlung erfolgt über Gumroad. Es fallen keine wiederkehrenden Kosten an.</P>

      <H>5. Widerrufsrecht</H>
      <P>Da es sich um digitale Inhalte handelt, die sofort nach dem Kauf zugänglich sind, erlischt das Widerrufsrecht gemäß § 18 Abs. 1 Z 11 FAGG mit Beginn der Ausführung des Vertrags, sofern Sie ausdrücklich zugestimmt haben, dass wir mit der Ausführung beginnen.</P>

      <H>6. Haftungsausschluss</H>
      <P>Die durch die KI generierten Inhalte (Lebensläufe, Anschreiben, Interviewfragen) sind Vorschläge und ersetzen keine professionelle Beratung. Der Anbieter übernimmt keine Garantie für den Erfolg von Bewerbungen. Die generierten Dokumente sollten vom Nutzer vor der Verwendung überprüft und angepasst werden.</P>

      <H>7. Nutzungsrechte</H>
      <P>Die generierten Dokumente gehören dem Nutzer. Der Anbieter beansprucht keine Rechte an den erstellten Inhalten.</P>

      <H>8. Verfügbarkeit</H>
      <P>Der Anbieter bemüht sich um eine hohe Verfügbarkeit der Anwendung, übernimmt jedoch keine Garantie für ununterbrochenen Zugang. Wartungsarbeiten werden wenn möglich im Voraus angekündigt.</P>

      <H>9. Datenschutz</H>
      <P>Es gilt die Datenschutzerklärung, abrufbar auf dieser Seite.</P>

      <H>10. Anwendbares Recht</H>
      <P>Es gilt österreichisches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist <Placeholder text={PLACEHOLDER_CITY} />, Österreich.</P>

      <H>11. Streitbeilegung</H>
      <P>Wir sind nicht verpflichtet, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen. Die EU-Kommission stellt eine Plattform zur Online-Streitbeilegung bereit: <A href="https://ec.europa.eu/consumers/odr">https://ec.europa.eu/consumers/odr</A></P>

      <P style={{ color: 'rgba(226,237,232,0.3)', fontSize: 12, marginTop: 24 }}>Stand: Juni 2025</P>

      <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, fontSize: 12, color: '#f87171' }}>
        ⚠ Bitte ersetze vor der Veröffentlichung: <strong><Placeholder text={PLACEHOLDER_NAME} /></strong> und <strong><Placeholder text={PLACEHOLDER_CITY} /></strong>
      </div>
    </LegalSection>
  );
}

export default function Legal() {
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState('impressum');

  const tabs = [
    { id: 'impressum', label: t[lang].legal_impressum_title },
    { id: 'datenschutz', label: t[lang].legal_privacy_title },
    { id: 'agb', label: t[lang].legal_agb_title },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="tool-hero scroll-reveal">
        <div className="tool-hero-badge">
          <span>§</span><span>{t[lang].nav_legal}</span>
        </div>
        <h1 className="tool-hero-h1">
          {t[lang].legal_impressum_title} · {t[lang].legal_privacy_title} · {t[lang].legal_agb_title}
        </h1>
        <p className="tool-hero-sub" style={{ maxWidth: 520 }}>
          {lang === 'DE'
            ? 'Rechtliche Informationen, Datenschutzerklärung und Allgemeine Geschäftsbedingungen.'
            : 'Legal notice, privacy policy and terms & conditions.'}
        </p>
      </div>

      <div className="tool-divider" style={{ margin: '24px 40px 32px' }} />

      <div className="tool-section" style={{ padding: '0 40px 80px' }}>
        {/* Tab buttons */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? '#e2ede8' : 'rgba(226,237,232,0.45)',
                borderBottom: activeTab === tab.id ? '2px solid #1D9E75' : '2px solid transparent',
                marginBottom: -1,
                transition: 'color 0.15s, border-color 0.15s',
                fontFamily: 'inherit',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'impressum' && <ImpressumContent />}
        {activeTab === 'datenschutz' && <DatenschutzContent />}
        {activeTab === 'agb' && <AgbContent />}
      </div>
    </div>
  );
}
