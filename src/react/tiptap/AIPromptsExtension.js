// TODO: Add a function that checks if the selection is empty, and if it is, then it selects up to 5000 characters around where the cursor
// TODO: Add a function before calling anything that limits the cursor selection length to about 5000 characters, so it would actually change the selection to that length
// TODO: Add a function that replaces the selection chosen by the previous functions with the output of the AI, and converts it to HTML
// TODO: Actually call the AI model, also pass in editor version to select the correct model
// TODO: Design the AI model in the backend.

const characterLimit = 5000;

async function addMarkerTags(editor, mySelection = null) {
    const { state, dispatch } = editor.view;
  
    // Get the start and end positions of the selection
    const { from, to } = mySelection == null ? state.selection : mySelection;
  
    // Create marker tags
    const startTag = '℥♨︎☈';
    const endTag = '🀒⚒︎🃗';
  
    // Create the transaction to modify the content
    const transaction = editor.view.state.tr;
    transaction.insertText(`${startTag}`, from, from);
    transaction.insertText(`${endTag}`, to + startTag.length, to + startTag.length);

    await dispatch(transaction);
}

const convertToMarkdown = async (editor, mySelection = null) => {

    editor.commands.save();

    await addMarkerTags(editor, mySelection);

    let htmlContent = editor.getHTML();

    // console.log('htmlContent', htmlContent)

    // replace all empty paragraphs and headings with <br>
    htmlContent = htmlContent.replace(/<p>\s*<\/p>/g, '<p>_</p>');
    htmlContent = htmlContent.replace(/<h1>\s*<\/h1>/g, '<h1>_</h1>');
    htmlContent = htmlContent.replace(/<h2>\s*<\/h2>/g, '<h2>_</h2>');
    htmlContent = htmlContent.replace(/<h3>\s*<\/h3>/g, '<h3>_</h3>');

    // replace editor's conetnt with the html content
    await editor.commands.setContent(htmlContent);
    
    // console.log('htmlContent', editor.getHTML())

    let MarkdownContent = editor.storage.markdown.getMarkdown();

    // look for all the <my-image base64="..." width="num"></my-image> tags, and replace them with ![image_0], ![image_1], etc. with each number corresponding to the order of the image in the document 
    // also save the base64 strings and width to an array so that they can be replaced with the actual images when the document is loaded
    let imageArray = [];
    let imageID = 0;

    htmlContent = htmlContent.replace(/<p>_<\/p>/g, '<p></p>');
    htmlContent = htmlContent.replace(/<h1>_<\/h1>/g, '<h1></h1>');
    htmlContent = htmlContent.replace(/<h2>_<\/h2>/g, '<h2></h2>');
    htmlContent = htmlContent.replace(/<h3>_<\/h3>/g, '<h3></h3>');

    htmlContent = htmlContent.replace(/℥♨︎☈/g, '');
    htmlContent = htmlContent.replace(/🀒⚒︎🃗/g, '');

    editor.commands.setContent(htmlContent);

    // also replace univode character U+2026 with ...
    MarkdownContent = MarkdownContent.replace(/\u2026/g, '...');

    MarkdownContent = MarkdownContent.replace(/\[\.\.\.+\]/g, '[...]');
    

    MarkdownContent = MarkdownContent.replace(/℥♨︎☈/g, '<cursor-start/>');
    MarkdownContent = MarkdownContent.replace(/🀒⚒︎🃗/g, '<cursor-end/>');
    
    // make sure to recvoer the base64 strings and width of the images and store it in imageArray
    MarkdownContent = MarkdownContent.replace(/<my-image\s+base64="([^<>"']*)"\s+width="([^<>"']*)">\s*<\/my-image>/g, (match, base64, width) => {
        imageArray.push({base64, width});
        return '![image_' + (imageID++) + ']';
    });     

    MarkdownContent = MarkdownContent.replace(/<my-image\s+base64="([^<>"']*)">\s*<\/my-image>/g, (match, base64) => {
        imageArray.push({base64, width:null});
        return '![image_' + (imageID++) + ']';
    });
    
    // This is a hack, but it works lmao
    MarkdownContent = MarkdownContent.replace(/<span\s+data-type="inline-math-box"\s+latex="([^<>]*)"\s+isnew="[^<>]*">\s*<\/span>/g, (match, latex) => {
        return '$$' + latex + '$$';
    });


    return {MarkdownContent, imageArray};
}


// this function returns a new M 
const getContext = (MDwithCursros, isPrompt, characterLimit, errorCallback) => {
    let MD = MDwithCursros;

    let startSelIndex = MD.indexOf('<cursor-start/>');

    MD = MD.replace('<cursor-start/>', '');

    let endSelIndex = MD.indexOf('<cursor-end/>');

    MD = MD.replace('<cursor-end/>', '');

    let context = '';

    if ( isPrompt ) {

        // get as many lines as we can from before the selection to give as context

        let start = 0;
        let end = startSelIndex;

        context = MD.substring( 0, end )
        let newContext = context;

        while ( newContext.length > characterLimit ) {
            context = newContext;
            start = MD.indexOf('\n', start + 1);
            newContext = MD.substring( start, end );
        }
    }
    else
    {
        
        // if selection is non empty, just return the selection if under limit
        // otherwise, select the current line, then as many lines to the top as possible, then if there is no more line on top, 
        // add as many lines to the bottom as possible without going over the limit

        if ( endSelIndex - startSelIndex < 5) {
            // selection is empty
            let start = startSelIndex;
            let end = endSelIndex;

            context = MD.substring( start, end );

            let newContext = context;

            while ( newContext.length < characterLimit ) {
                context = newContext;
                startSelIndex = start;
                start = MD.lastIndexOf('\n', start - 1);

                if ( start == -1 ){
                    start = 0;
                    newContext = MD.substring( start, end );
                    if ( newContext.length < characterLimit ){
                        context = newContext;
                        startSelIndex = start;
                    }
                    break;
                }

                newContext = MD.substring( start, end );
            }

            newContext = context;

            while ( newContext.length < characterLimit ) {
                context = newContext;
                endSelIndex = end;
                end = MD.indexOf('\n', end + 1);

                if ( end == -1 ){
                    end = MD.length;
                    newContext = MD.substring( startSelIndex, end );
                    if ( newContext.length < characterLimit ){
                        context = newContext;
                        endSelIndex = end;
                    }
                    break;
                }

                newContext = MD.substring( startSelIndex, end );
            }

        } else {
            context = MD.substring( startSelIndex, endSelIndex );

            if ( context.length > characterLimit){
                errorCallback('Selection is too long. You can select a smaller portion (around 5000 characters), or keep your selection empty, and we\'ll select the biggest portion we can find around your cursor.');
                return null;
            }
        }

    }

    return {userContext: context, MDBefore: MD.substring(0, startSelIndex), MDAfter: MD.substring(endSelIndex)};
}


const convertBackToHTML = async (editor, MarkdownContent, imageArray) => {
    // replace all the ![image_0], ![image_1], etc. with the actual images
    MarkdownContent = MarkdownContent.replace(/\!\[image_(\d+)\]/g, (match, p1) => {
        return '<my-image base64="' + imageArray[p1].base64 + (imageArray[p1].width ?  '" width="' + imageArray[p1].width : '' ) + '"></my-image>';
    });
    
    // This is a hack, but it works lmao
    MarkdownContent = MarkdownContent.replace(/\$\$([^$]*)\$\$/g, (match, p1) => {
        return '<span data-type="inline-math-box" latex="' + p1 + '" isnew="false"></span>';
    });
    
    // apply the markdown to the editor
    await editor.commands.setContent(MarkdownContent);

    let htmlContent = editor.getHTML();

    htmlContent = htmlContent.replace(/<p>_<\/p>/g, '<p></p>');
    htmlContent = htmlContent.replace(/<h1>_<\/h1>/g, '<h1></h1>');
    htmlContent = htmlContent.replace(/<h2>_<\/h2>/g, '<h2></h2>');
    htmlContent = htmlContent.replace(/<h3>_<\/h3>/g, '<h3></h3>');

    editor.commands.setContent(htmlContent);

    editor.commands.save();
}


export const callAIPromptWithQuestion = async (editor, promptTitle, userPrompt, errorCallback, loadingCallback, selection, paymentCallback, serverURL, userID, version) => {

    if(promptTitle !== 'Prompt'){
        return errorCallback('Invalid prompt title.');
    }

    let {MarkdownContent, imageArray} = await convertToMarkdown(editor, selection);

    // console.log('MarkdownContent Before:\n\n' + MarkdownContent);

    let contextRes = getContext(MarkdownContent, true, characterLimit, errorCallback);
    if ( !contextRes ) return;

    const {userContext, MDBefore, MDAfter} = contextRes;

    loadingCallback(true);

    const data = {
        context: userContext,
        prompt: userPrompt,
        userID: userID,
        version: version
    };

    let AIResponse = await fetch(serverURL + '/ai/' + promptTitle, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        return data;
    }).catch(error => {
        console.error('Error:', error);
        return {error: error.message}
    });
        
    if ( ! AIResponse ) {
        loadingCallback(false);
        return errorCallback('Error fetching, please try again, no AI usage was deducted.');
    }

    if( AIResponse.error ){
        loadingCallback(false);
        if(AIResponse.error === 'user banned'){
            return paymentCallback(true);
        }else{
            return errorCallback(AIResponse.error);
        }
    }

    if( ! AIResponse[0] ){
        loadingCallback(false);
        return errorCallback('Error fetching, please try again, no AI usage was deducted.');
    }

    if( ! AIResponse[0].candidates || AIResponse[0].candidates.length === 0 ){
        loadingCallback(false);
        if ( AIResponse[0].filters.length > 0 )
            return errorCallback('Your request was blocked due to ' + AIResponse[0].filters[0].reason + ' filter. Please try again with a different selection.');
        return errorCallback('Error fetching, please try again, no AI usage was deducted.');
    }

    const MDAnswer = AIResponse[0].candidates[0].output;

    console.log('MDAnswer:\n\n', MDAnswer);

    const newMD = MDBefore + MDAnswer + MDAfter; 

    convertBackToHTML(editor, newMD, imageArray);

    loadingCallback(false);

}


export const callAIPrompt = async (editor, promptTitle, errorCallback, loadingCallback, paymentCallback, serverURL, userID, version) => {
    // if the editor is not in focus, throw an erro
    if( !editor.isActive() ){
        return errorCallback('The editor is not in focus.');
    }

    if(promptTitle !== 'Beautify' && promptTitle !== 'FillBlanks'){
        return errorCallback('Invalid prompt title.');
    }


    let {MarkdownContent, imageArray} = await convertToMarkdown(editor);

    console.log('MarkdownContent Before:\n\n' + MarkdownContent);

    let contextRes = getContext(MarkdownContent, false, characterLimit, errorCallback);
    if ( !contextRes ) return;

    const {userContext, MDBefore, MDAfter} = contextRes;

    let question;

    if(promptTitle === 'Beautify'){
        question = userContext;
    } else if (promptTitle === 'FillBlanks') {
        question = userContext;
    } else {
        return errorCallback('Invalid prompt title.');
    }

    loadingCallback(true);

    const data = {
        context: question,
        userID: userID,
        version: version
    };

    let AIResponse = await fetch(serverURL + '/ai/' + promptTitle, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        return data;
    }).catch(error => {
        console.error('Error:', error);
        return {error: error.message}
    });
        
    if ( ! AIResponse ) {
        loadingCallback(false);
        return errorCallback('Error fetching, please try again, no AI usage was deducted.');
    }

    if( AIResponse.error ){
        loadingCallback(false);
        if(AIResponse.error === 'user banned'){
            return paymentCallback(true);
        }else{
            return errorCallback(AIResponse.error);
        }
    }

    if( ! AIResponse[0] ){
        loadingCallback(false);
        return errorCallback('Error fetching, please try again, no AI usage was deducted.');
    }

    if( ! AIResponse[0].candidates || AIResponse[0].candidates.length === 0 ){
        loadingCallback(false);
        if ( AIResponse[0].filters.length > 0 )
            return errorCallback('Your request was blocked due to ' + AIResponse[0].filters[0].reason + ' filter. Please try again with a different selection.');
        return errorCallback('Error fetching, please try again, no AI usage was deducted.');
    }

    const MDAnswer = AIResponse[0].candidates[0].output;

    console.log('MDAnswer:\n\n', MDAnswer);

    let newMD;
    
    if ( promptTitle === 'Beautify' )
        newMD = MDBefore + MDAnswer + MDAfter; 
    else if ( promptTitle === 'FillBlanks' ){
        // each block is separated by ===== with 5 or more = signs
        const blocks = MDAnswer.split(/={5,}/g);

        // for each block, remove up to one trailing and one leading new lines
        for ( let i = 0; i < blocks.length; i++ ){
            blocks[i] = blocks[i].replace(/^\n/, '');
            blocks[i] = blocks[i].replace(/\n$/, '');
        }

        console.log('blocks', blocks);

        let partReplace = userContext;

        // replace each \[...\] in newMD with the corresponding block in order
        let blockIndex = 0;
        
        partReplace = partReplace.replace(/\\\[\.\.\.+\\\]/g, (match) => {
            if ( blockIndex >= blocks.length ) return match;
            return blocks[blockIndex++];
        });

        console.log('partReplace', partReplace);

        newMD = MDBefore + partReplace + MDAfter; 
    }

    convertBackToHTML(editor, newMD, imageArray);

    loadingCallback(false);
}

