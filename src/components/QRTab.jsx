import UploadTab from './UploadTab.jsx'

// QR-specific entry point for the shared image picker.
export default function QRTab(props) {
  return <UploadTab {...props} kind="qr" />
}
