import { Highlight } from "@tiptap/extension-highlight";
import markdownitMark from 'markdown-it-mark';

export default Highlight.extend({
    addStorage() {
        return {
            markdown: {
                serialize: {
                    open: '==',
                    close: '==',
                },
                parse: {
                    setup(markdownit) {
                        markdownit.use(markdownitMark);
                    },
                    updateDOM() {
                        return [
                            {
                                tag: 'mark',
                            },
                        ];
                    }
                }
            }
        }
    }
});