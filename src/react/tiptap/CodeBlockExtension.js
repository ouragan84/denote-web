import './styles.scss'

import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, addNodeView } from '@tiptap/react'
import React from 'react'
import { lowlight } from 'lowlight'

// TODO: use highlight.js for syntax highlighting, and remove useless language options
// q: how I make the 

export const CodeBlockComponent = ({ node: { attrs: { language: defaultLanguage } }, updateAttributes, extension }) => (
  <NodeViewWrapper className="code-block">
    <select contentEditable={false} defaultValue={defaultLanguage} onChange={event => updateAttributes({ language: event.target.value })}>
      <option value="null">
        auto
      </option>
      <option disabled>
        —
      </option>
      {extension.options.lowlight.listLanguages().map((lang, index) => (
        <option key={index} value={lang}>
          {lang}
        </option>
      ))}
    </select>
    <pre>
      <NodeViewContent as="code" />
    </pre>
  </NodeViewWrapper>
)


const CodeBlockExtension = 
    CodeBlockLowlight
        .extend({
        addNodeView() {
            return ReactNodeViewRenderer(CodeBlockComponent)
        },
        })
        .configure({ lowlight })

export default CodeBlockExtension;