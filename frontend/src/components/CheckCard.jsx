import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, Camera, Image, Link2, MessageSquareText, QrCode, ShieldCheck, Upload } from 'lucide-react';
import { ASSETS } from '../assets.js';
import AskSurfy from './AskSurfy.jsx';

const TABS = [
  { id: 'text', Icon: MessageSquareText },
  { id: 'links', Icon: Link2 },
  { id: 'image', Icon: Image },
  { id: 'qr', Icon: QrCode },
];

function FilePreview({ file, onRemove, disabled, t }) {
  const [previewUrl, setPreviewUrl] = useState('');
  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!file || !previewUrl) return null;
  return (
    <div className="selected-file-preview">
      <img src={previewUrl} alt={t('check.image.preview')} width="64" height="64" />
      <span className="selected-file">{file.name}</span>
      <button type="button" onClick={onRemove} disabled={disabled}>{t('check.image.remove')}</button>
    </div>
  );
}

export default function CheckCard({
  activeTab,
  inputs,
  onTabChange,
  onInputChange,
  onCheck,
  onReset,
  onCamera,
  isAnalyzing,
  isCheckUsed,
  status,
  isAskOpen,
  isAskClosing,
  isAskThinking,
  askMessages,
  result,
  onAskSend,
  surfyOpenRequest,
  feedbackDialog,
  t,
  children,
}) {
  const tabRefs = useRef([]);
  const cardRef = useRef(null);
  const id = useId();
  const panelId = `${id}-panel`;
  const selectedTab = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];
  const currentFile = activeTab === 'image' ? inputs.image : inputs.qr;
  const isLocked = isCheckUsed || isAnalyzing || status === 'result';
  const canCheck =
    (activeTab === 'text' && inputs.message.trim().length > 0) ||
    (activeTab === 'links' && inputs.url.trim().length > 0) ||
    ((activeTab === 'image' || activeTab === 'qr') && Boolean(currentFile));
  const [ruleIndex, setRuleIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setRuleIndex((current) => (current + 1) % 3), 6000);
    return () => window.clearInterval(timer);
  }, []);

  useLayoutEffect(() => {
    // The chat grows independently; keep its composer inside the natural card.
    if (isAskOpen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const card = cardRef.current;
    if (!card || typeof ResizeObserver === 'undefined') return undefined;

    let previousHeight;
    let animationFrame = 0;
    let isAnimating = false;
    const observer = new ResizeObserver(() => {
      const nextHeight = card.getBoundingClientRect().height;
      if (previousHeight === undefined) {
        previousHeight = nextHeight;
        return;
      }
      if (isAnimating || Math.abs(nextHeight - previousHeight) < 1) return;

      isAnimating = true;
      card.style.height = `${previousHeight}px`;
      card.style.overflow = 'hidden';
      card.getBoundingClientRect();
      animationFrame = window.requestAnimationFrame(() => {
        card.style.height = `${nextHeight}px`;
      });
    });
    const finishAnimation = (event) => {
      if (event.target !== card || event.propertyName !== 'height') return;
      card.style.height = 'auto';
      card.style.overflow = '';
      previousHeight = card.getBoundingClientRect().height;
      isAnimating = false;
    };

    card.addEventListener('transitionend', finishAnimation);
    observer.observe(card);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(animationFrame);
      card.removeEventListener('transitionend', finishAnimation);
      card.style.height = '';
      card.style.overflow = '';
    };
  }, [isAskOpen]);

  useLayoutEffect(() => {
    if (!isAskOpen || status !== 'result') return undefined;
    const grid = cardRef.current?.querySelector('.check-columns');
    const input = grid?.querySelector('.check-input-column');
    if (!input) return undefined;
    // A tall result must not stretch the row above the assistant.
    const measure = () => grid.style.setProperty('--check-input-row', `${input.getBoundingClientRect().height}px`);
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(input);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      grid.style.removeProperty('--check-input-row');
    };
  }, [isAskOpen, status]);

  const selectTab = (nextIndex) => {
    if (isLocked) return;
    const nextTab = TABS[nextIndex].id;
    onTabChange(nextTab);
    tabRefs.current[nextIndex]?.focus();
  };
  const handleTabKeyDown = (event, index) => {
    if (isLocked) return;
    let nextIndex = index;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % TABS.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + TABS.length) % TABS.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = TABS.length - 1;
    if (nextIndex !== index) {
      event.preventDefault();
      selectTab(nextIndex);
    }
  };
  const selectFile = (file, key) => {
    if (file && !isLocked) {
      onInputChange(key, file);
      if (key === 'qr') onInputChange('qrValue', '');
    }
  };

  return (
    <section className="check-section" id="check" aria-labelledby={`${id}-title`}>
      <div className="check-card page-container" ref={cardRef}>
        <img
          className="check-foam"
          src={ASSETS.waveFoam}
          alt=""
          aria-hidden="true"
          width="1000"
          height="1000"
          loading="lazy"
          decoding="async"
        />
        <div className="section-title check-title">
          <h2 id={`${id}-title`}>{t('check.title')}</h2>
          <span aria-hidden="true" />
          <div className="golden-rules" id="golden-rules" aria-live="polite">
            <p>{t('check.rules.label')}</p>
            <div className="golden-rules-headline">
              <h3 key={ruleIndex}>
                {t(['check.rules.first', 'check.rules.second', 'check.rules.third'][ruleIndex])}
              </h3>
            </div>
          </div>
        </div>

        <div className={`check-columns${isAskOpen ? ' has-ask-panel' : ''}${status === 'result' ? ' has-check-result' : ''}`}>
          <div className={`check-input-column${isAskOpen ? ' has-ask' : ''}`}>
            <div className="input-card">
              <div className="check-tabs" role="tablist" aria-label={t('check.tabs.label')}>
                {TABS.map(({ id: tabId, Icon }, index) => (
                  <button
                    key={tabId}
                    ref={(element) => {
                      tabRefs.current[index] = element;
                    }}
                    id={`${id}-${tabId}-tab`}
                    className={`check-tab ${activeTab === tabId ? 'is-active' : ''}`}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tabId}
                    aria-controls={panelId}
                    tabIndex={activeTab === tabId ? 0 : -1}
                    disabled={isLocked}
                    onClick={() => {
                      if (!isLocked) onTabChange(tabId);
                    }}
                    onKeyDown={(event) => handleTabKeyDown(event, index)}
                  >
                    <Icon aria-hidden="true" />
                    <span>{t(`check.tabs.${tabId}`)}</span>
                  </button>
                ))}
              </div>

              <div className="check-workspace">
                <div className="guide-row">
                  <div className="guide-bubble">{t('check.guide')}</div>
                  <img
                    className="guide-mascot"
                    src={ASSETS.surfyPoint}
                    alt=""
                    width="1000"
                    height="1000"
                    decoding="async"
                  />
                </div>

                <div className="check-form-column">
                  <div
                    id={panelId}
                    className="tab-panel"
                    role="tabpanel"
                    aria-labelledby={`${id}-${selectedTab.id}-tab`}
                    tabIndex="0"
                  >
                    {activeTab === 'text' && (
                      <div className="field-group">
                        <div className="field-heading">
                          <label htmlFor={`${id}-message`}>{t('check.text.label')}</label>
                        </div>
                        <textarea
                          id={`${id}-message`}
                          maxLength="12000"
                          value={inputs.message}
                          placeholder={t('check.text.placeholder')}
                          onChange={(event) => onInputChange('message', event.target.value)}
                          disabled={isLocked}
                          aria-describedby={`${id}-message-help`}
                        />
                        <div className="field-meta">
                          <p className="field-help" id={`${id}-message-help`}>
                            {t('check.text.languages')}
                          </p>
                          <span>{inputs.message.length.toLocaleString()} / 12,000</span>
                        </div>
                      </div>
                    )}

                    {activeTab === 'links' && (
                      <div className="field-group">
                        <label htmlFor={`${id}-url`}>{t('check.link.label')}</label>
                        <textarea
                          id={`${id}-url`}
                          className="text-input"
                          inputMode="url"
                          autoComplete="url"
                          placeholder={t('check.link.placeholder')}
                          value={inputs.url}
                          onChange={(event) => onInputChange('url', event.target.value)}
                          onBlur={() => onInputChange('url', inputs.url.trim())}
                          disabled={isLocked}
                          aria-describedby={`${id}-url-help`}
                        />
                        <p className="field-help" id={`${id}-url-help`}>{t('check.link.privacy')}</p>
                      </div>
                    )}

                    {(activeTab === 'image' || activeTab === 'qr') && (
                      <div className="field-group">
                        <label htmlFor={`${id}-${activeTab}-file`}>
                          {t(activeTab === 'image' ? 'check.image.label' : 'check.qr.label')}
                        </label>
                        <div
                          className={`upload-area ${activeTab === 'qr' ? 'qr-upload-area' : ''}`}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();
                            if (isLocked) return;
                            selectFile(event.dataTransfer.files?.[0], activeTab);
                          }}
                        >
                          {activeTab === 'qr' ? <QrCode aria-hidden="true" /> : <Upload aria-hidden="true" />}
                          <p>{t(activeTab === 'image' ? 'check.image.drop' : 'check.qr.drop')}</p>
                          {activeTab === 'image' && <span>{t('check.image.formats')}</span>}
                          <label className="upload-button" htmlFor={`${id}-${activeTab}-file`}>
                            <Image aria-hidden="true" />
                            {t('check.image.choose')}
                          </label>
                          <input
                            id={`${id}-${activeTab}-file`}
                            className="visually-hidden"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            aria-label={t(activeTab === 'image' ? 'check.image.choose' : 'check.qr.choose')}
                            disabled={isLocked}
                            onChange={(event) => {
                              selectFile(event.target.files?.[0], activeTab);
                              event.target.value = '';
                            }}
                          />
                          {currentFile && (
                            <FilePreview
                              file={currentFile}
                              disabled={isLocked}
                              onRemove={() => {
                                if (isLocked) return;
                                onInputChange(activeTab, null);
                                if (activeTab === 'qr') onInputChange('qrValue', '');
                              }}
                              t={t}
                            />
                          )}
                          {activeTab === 'qr' && inputs.qrValue && (
                            <div className="qr-decoded" aria-live="polite">
                              <strong>{t('check.qr.decoded')}</strong>
                              <p>{inputs.qrValue}</p>
                            </div>
                          )}
                        </div>
                        <button
                          className="camera-button"
                          type="button"
                          onClick={() => onCamera(activeTab)}
                          disabled={isLocked}
                        >
                          <Camera aria-hidden="true" />
                          {t(activeTab === 'image' ? 'check.camera.use' : 'check.qr.scan')}
                        </button>
                        {activeTab === 'qr' && (
                          <p className="field-help">{t('check.qr.inert')}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    className="check-button"
                    type="button"
                    disabled={!canCheck || isLocked}
                    aria-disabled={!canCheck || isLocked}
                    onClick={onCheck}
                  >
                    <ShieldCheck aria-hidden="true" />
                    {isAnalyzing ? t('result.loading') : t('check.button')}
                    <ArrowDown aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {isAskOpen && (
            <div className="ask-panel-position">
              <AskSurfy
                isOpen={isAskOpen}
                isClosing={isAskClosing}
                isThinking={isAskThinking}
                messages={askMessages}
                onSend={onAskSend}
                openRequest={surfyOpenRequest}
                result={result}
                t={t}
              />
            </div>
          )}

          <div className="check-result-column">
            {children}
            {status === 'result' && (
              <button className="new-check-button" type="button" onClick={onReset}>
                {t('check.new')}
                <ArrowRight aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {feedbackDialog}
      </div>
    </section>
  );
}
