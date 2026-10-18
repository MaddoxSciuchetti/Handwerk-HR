import React from 'react';
import { createRoot } from 'react-dom/client';
import { EditorContent } from '@tiptap/react';
import { useStyledDocumentEditor } from './features/settings/documents/hooks/useStyledDocumentEditor';
import { DocumentValuesContext } from './features/settings/documents/DocumentValuesContext';
import { fromSegments } from '@shared/document';
import './index.css';
const document = fromSegments([
 {type:'input',key:'contract.name',label:'Name'},
 {type:'text',text:'Direkt daneben stehen mehrere Wörter. Übergröße geprüft!'},
 {type:'input',key:'contract.end',label:'Ende'},
 {type:'text',text:'Danach weiter.'},
]);
document.content.content!.push({type:'paragraph',content:[{type:'text',text:'Zweite Zeile mit weiteren Wörtern.'}]});
document.content.content!.push({type:'lineGroup',attrs:{height:30,lines:[],labels:[{text:'Label Wörter neben Feld',left:30,top:0,fontSize:12,color:'#000000'}]}});
function App() {
 const {editor} = useStyledDocumentEditor({document,master:true,readOnly:false,section:'content',pageView:false});
 (window as any).selectionEditor=editor;
 return <DocumentValuesContext.Provider value={{master:true,readOnly:false,values:{},onValueChange:()=>{}}}><div className="styled-document" style={{margin:50,width:800,fontFamily:'Arial',fontSize:'16px'}}><EditorContent editor={editor}/></div></DocumentValuesContext.Provider>;
}
createRoot(window.document.getElementById('root')!).render(<App/>);
