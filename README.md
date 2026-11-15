# SURFARE: Digital Safety Assistant

**CS Bootcamp: Build the Way Forward — Competition Entry**

> Your digital safety starts here.

## About the Project

Surfare is an offline-first, online-enhanced Digital Safety Assistant currently under development as a competition entry for **CS Bootcamp: Build the Way Forward**.

The project aims to help users identify potentially suspicious digital content, recognize possible online threats, and make informed decisions before interacting with questionable messages, links, images, and QR codes.

With a focus on accessibility and understandable threat explanations, Surfare aims to make digital safety more approachable, particularly for users who may have difficulty recognizing online scams and deceptive content.

## Problem Statement

The increasing prevalence of online scams, phishing attempts, and misleading digital content makes it difficult for users to distinguish legitimate information from potentially harmful content.

Many users lack the technical knowledge and tools needed to recognize warning signs, verify suspicious links, and assess potentially fraudulent messages.

Surfare aims to address this problem through an accessible digital safety assistant that provides content analysis, risk classification, and actionable safety recommendations.

## Proposed Features

- **Message Detection** — Identifies suspicious language and potential scam indicators in submitted messages.
- **URL Detection** — Examines links for suspicious characteristics and potential threats.
- **Image Analysis** — Uses image processing and OCR to extract and analyze relevant content.
- **QR Code Detection** — Decodes QR codes and evaluates their extracted content.
- **Risk Classification** — Provides Low, Medium, High, or Insufficient Evidence classifications.
- **Threat Explanation** — Presents understandable warning signs and safety recommendations.
- **Offline-First Analysis** — Supports local detection capabilities without requiring a continuous internet connection.
- **Online Threat Verification** — Uses external threat-checking services when internet access is available.

*Features are subject to refinement throughout development.*

## Technology Stack

| Category | Technology |
|---|---|
| Frontend | React.js, JavaScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Image Processing / OCR | Tesseract.js |
| QR Detection | jsQR |
| Backend / Online Services | Under development |
| Version Control | Git and GitHub |

## Project Structure

```text
surfare/
├── backend/
├── dataset/
├── design/
├── docs/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── hooks/
│   ├── modules/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   └── utils/
├── tests/
├── README.md
└── package.json
