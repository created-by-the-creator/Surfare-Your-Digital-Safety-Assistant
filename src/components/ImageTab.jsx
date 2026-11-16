import UploadTab from './UploadTab.jsx'

// Image-specific entry point for the shared image picker.
export default function ImageTab(props) {
  return <UploadTab {...props} kind="image" />
}
