    // Speech Synthesis Script
    let currentVoiceType = 'female';
    let allVoices = [];

    const loadVoices = () => { allVoices = window.speechSynthesis.getVoices(); }
    window.speechSynthesis.onvoiceschanged = loadVoices;
    if (window.speechSynthesis.getVoices().length > 0) loadVoices();

    const getVoice = (type) => {
      if (!allVoices.length) return null;
      type = type.toLowerCase();
      let voice = allVoices.find(v => (type === 'female' ? /female|zira|samantha/i : /male|alex|david/i).test(v.name));
      return voice || allVoices[0];
    }

    document.getElementById('readButton').addEventListener('click', () => {
      const text = window.getSelection().toString().trim();
      if (!text) return;
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = getVoice(currentVoiceType);
      if (voice) utterance.voice = voice;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });

    document.getElementById('readButton').addEventListener('dblclick', function () {
      const voiceIcon = document.getElementById('voiceIcon');
      currentVoiceType = currentVoiceType === 'female' ? 'male' : 'female';
      voiceIcon.textContent = currentVoiceType === 'female' ? '🎙️' : '🎙';
      this.title = currentVoiceType === 'female' ? "Select text you want to be read" : "(Male Voice)";
      window.speechSynthesis.cancel();
    });
    //end of reader//
    
    
    
    
    
    
