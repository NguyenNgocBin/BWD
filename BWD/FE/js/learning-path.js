(function(){
    const STORAGE_KEY="dongsonLearningPathV1";
    const API="http://localhost:5000/api/v1/game-sessions/me?limit=50";
    let activeLesson=1;
    let completed;
    try { completed=new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]")); }
    catch (error) { completed=new Set(); }
    const navButtons=Array.from(document.querySelectorAll("[data-lesson]"));
    const panels=Array.from(document.querySelectorAll("[data-lesson-panel]"));
    const progressBar=document.getElementById("pathProgressBar");
    const progressText=document.getElementById("pathProgressText");
    const completeButton=document.getElementById("completeLesson");
    function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify([...completed].sort()));}
    function render(){
        navButtons.forEach(btn=>{const n=Number(btn.dataset.lesson);btn.classList.toggle("active",n===activeLesson);btn.classList.toggle("completed",completed.has(n));});
        panels.forEach(panel=>panel.hidden=Number(panel.dataset.lessonPanel)!==activeLesson);
        const count=completed.size;progressBar.style.width=`${count/5*100}%`;progressText.textContent=`${count}/5 bài hoàn thành`;
        completeButton.textContent=completed.has(activeLesson)?"Đã hoàn thành ✓":activeLesson===5?"Hoàn thành game để xác nhận":"Đánh dấu hoàn thành";
        completeButton.disabled=activeLesson===5&&!completed.has(5);
        document.getElementById("previousLesson").disabled=activeLesson===1;document.getElementById("nextLesson").disabled=activeLesson===5;
    }
    function openLesson(n){activeLesson=Math.max(1,Math.min(5,n));render();}
    navButtons.forEach(btn=>btn.addEventListener("click",()=>openLesson(Number(btn.dataset.lesson))));
    document.getElementById("previousLesson").addEventListener("click",()=>openLesson(activeLesson-1));
    document.getElementById("nextLesson").addEventListener("click",()=>openLesson(activeLesson+1));
    completeButton.addEventListener("click",()=>{if(activeLesson===5)return;completed.add(activeLesson);save();render();});
    async function syncQuizCompletion(){
        const {token}=window.DongSonAuth?.getStoredAuth()||{};if(!token)return;
        try{const response=await fetch(API,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});const data=await response.json();if(!response.ok)return;const quiz=data.sessions?.find(x=>x.game_code==="codechayquiz");if(quiz){completed.add(5);save();document.getElementById("quizLessonStatus").textContent=`Đã xác nhận kết quả quiz: ${quiz.score} điểm.`;render();}}catch(error){console.error(error);}
    }
    render();syncQuizCompletion();
})();
