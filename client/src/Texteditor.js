import React, { useCallback, useEffect, useState } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import {io} from 'socket.io-client'
import { useParams } from 'react-router'
import {DateTime} from 'luxon'

const TOOLBAR_OPTIONS = [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["bold", "italic", "underline"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ align: [] }],
    ["image", "blockquote", "code-block"],
    ["save"],
    
    
  ]

export default function TextEditor() {

    const [lastsaved, setLastSaved] = useState(0)

    const {id: documentID}  = useParams()
    const [socket, setSocket] = useState()
    const [quill, setQuill] = useState()
    const [lastlength, setLastLength] = useState(0)





    useEffect(() => {
        const s = io(`http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}`)
        setSocket(s)

        return () => {
            
            s.disconnect()
        }
    },[])

    const savedocument = useCallback(() => {
        socket.emit('save-document', quill.getContents())
        const date = Date.now()
        setLastSaved(date)
    }, [quill, socket])

    useEffect(() => {
        if((!!socket && !!quill) === false) return 

        const handler = (delta, oldDelta, source) => {
            if(source !== 'user') return 
                            
            if(Math.abs(lastlength - quill.getLength()) > 5){
                setLastLength(quill.getLength())
                savedocument()               
            }

            socket.emit('send-changes', delta)
        }

        quill.on('text-change', handler)

        return () => {
            quill.off('text-change', handler)
        }
    }, [socket, quill, lastlength, savedocument])


    useEffect(() => {
        if((!!socket && !!quill) === false) return 

        const handler = (delta) => {
            quill.updateContents(delta)
        }

        socket.on('receive-changes', handler)

        return () => {
            socket.off('receive-changes', handler)
        }
    }, [socket, quill])

    useEffect(() => {
        if((!!socket && !!quill) === false) return 

        socket.once('load-document', (document) => {
            quill.setContents(document)
            quill.enable()
        })

        socket.emit('get-document', documentID)
    }, [socket, quill, documentID])

    const Save = () => {
        return(
            <div><button onClick={() => savedocument() } >Save</button></div>
        )
    }


    const wrapperRef = useCallback((wrapper) => {
        if(wrapper == null) return null
        wrapper.innerHTML = ""
        const editor  = document.createElement("div")
        editor.id="editor"
        wrapper.append(editor)
        
        const q = new Quill(editor, {theme: "snow", modules: {toolbar: TOOLBAR_OPTIONS}})
        setQuill(q)
        q.setText('loading...')
        q.disable()
    }, [])


    return(
        <div>
        <div style={{"display": "flex", "flex-direction": "row", "padding": "5px"}}>
            <div>last saved: {DateTime.fromMillis(lastsaved).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}</div>
            <div><button onClick={() => savedocument() } >Save</button></div>
        </div>
        <div className="container" ref={wrapperRef}>
       
        </div>
        </div>
    )
}