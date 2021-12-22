import {useState, useEffect} from "react";
import axios from "axios";
import './App.css';

const chunkSize = 5*1024*1024;

function App() {

  const [dropzoneActive, setDropzoneActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(null);
  const [lastUploadedFileIndex, setLastUploadedFileIndex] = useState(null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(null);

  function handleDrop(e) {
    e.preventDefault();
    setFiles([...files, ...e.dataTransfer.files]);
  }

  function readAndUploadCurrentChunk() {
    const reader = new FileReader();
    const file = files[currentFileIndex];
    if (!file) {
      return;
    }
    const from = currentChunkIndex * chunkSize;
    const to = from + chunkSize;
    const blob = file.slice(from, to);
    reader.onload = e => uploadChunk(blob);
    reader.readAsDataURL(blob);
  }

  function uploadChunk(readerEvent) {
    const file = files[currentFileIndex];
    const data = readerEvent;
    const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTY0MDA1MTQ4MiwianRpIjoiZDZiNDNkMzctMDJiMS00OTExLWEyNzQtNDhlOGMyN2RiNDlhIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6eyJpZF91c2VyIjoiMmJmNDY1MDMtMTYzMjgxODQyNCIsInVzZXJuYW1lIjoiYWRtaW4iLCJmdWxsX25hbWUiOiJWXHUwMTAzbiBBIiwiZW1haWwiOiJ2aWVudHZAZ21haWwuY29tIiwiaWRfd29ya19hZGRyZXNzIjoiZDQ1OWFkNjctMTYzMjgxODgyOSIsInBob25lX251bWJlciI6IjAxMjU2NDYyMzIiLCJjcmVhdGVfYXQiOiIxNjMyODE4NDI0IiwiYWN0aXZlIjoiYWN0aXZlIiwicm9sZSI6ImFkbWluIiwid29ya19hZGRyZXNzIjoiXHUwMTEwXHUwMWExbiB2XHUxZWNiIDEiLCJ3b3JrX2FkZHJlc3NfY29kZSI6Ilx1MDExMFYxIn0sIm5iZiI6MTY0MDA1MTQ4MiwiZXhwIjoxOTU1NDExNDgyfQ.3ODGuhRPgTJP7DkJonYlONcuYltVltzKT_SsRdNiqu4"
    const params = new FormData();
    params.append('name', file.name);
    params.append('file', data);
    params.append('size', file.size);
    params.append("chunk_offset", currentChunkIndex*chunkSize)
    params.append('current_chunkindex', currentChunkIndex);
    params.append('total_chunks', Math.ceil(file.size / chunkSize));
    const headers = {
      "Content-Type": "multipart/form-data",
      "Accept": 'application/json',
      'Authorization': 'Bearer ' + token
    }
    const id_dataset = "21aa8e7f-1640056918";
    const url = 'https://ai.thinklabs.com.vn/api/dataset/'+id_dataset+'/import_zipfile';
    axios.post(url, params, {headers})
      .then(response => {
        const file = files[currentFileIndex];
        const filesize = files[currentFileIndex].size;
        const chunks = Math.ceil(filesize / chunkSize) - 1;
        const isLastChunk = currentChunkIndex === chunks;
        if (isLastChunk) {
          file.finalFilename = response.data.finalFilename;
          setLastUploadedFileIndex(currentFileIndex);
          setCurrentChunkIndex(null);
        } else {
          setCurrentChunkIndex(currentChunkIndex + 1);
        }
      })
      .catch(e => {
        if (e.response && e.response.data) {
          console.log(e.response) // some reason error message
       }
      });
  }

  useEffect(() => {
    if (lastUploadedFileIndex === null) {
      return;
    }
    const isLastFile = lastUploadedFileIndex === files.length - 1;
    const nextFileIndex = isLastFile ? null : currentFileIndex + 1;
    setCurrentFileIndex(nextFileIndex);
  }, [lastUploadedFileIndex]);

  useEffect(() => {
    if (files.length > 0) {
      if (currentFileIndex === null) {
        setCurrentFileIndex(
          lastUploadedFileIndex === null ? 0 : lastUploadedFileIndex + 1
        );
      }
    }
  }, [files.length]);

  useEffect(() => {
    if (currentFileIndex !== null) {
      setCurrentChunkIndex(0);
    }
  }, [currentFileIndex]);

  useEffect(() => {
    if (currentChunkIndex !== null) {
      readAndUploadCurrentChunk();
    }
  }, [currentChunkIndex]);

  return (
    <div>
      <div
        onDragOver={e => {setDropzoneActive(true); e.preventDefault();}}
        onDragLeave={e => {setDropzoneActive(false); e.preventDefault();}}
        onDrop={e => handleDrop(e)}
        className={"dropzone" + (dropzoneActive ? " active" : "")}>
        Drop your files here
      </div>
      <div className="files">
        {files.map((file,fileIndex) => {
          let progress = 0;
          if (file.finalFilename) {
            progress = 100;
          } else {
            const uploading = fileIndex === currentFileIndex;
            const chunks = Math.ceil(file.size / chunkSize);
            if (uploading) {
              progress = Math.round(currentChunkIndex / chunks * 100);
            } else {
              progress = 0;
            }
          }
          return (
            <a className="file" target="_blank"
               href={'http://localhost:5050/uploads/'+file.finalFilename}>
              <div className="name">{file.name}</div>
              <div className={"progress " + (progress === 100 ? 'done' : '')}
                   style={{width:progress+'%'}}>{progress}%</div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default App;
