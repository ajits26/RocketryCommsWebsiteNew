(function () {
    const KEY = "rocketPosts";
    const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
    const save = (p) => localStorage.setItem(KEY, JSON.stringify(p));

    document.addEventListener("DOMContentLoaded", () => {
        const user = getCurrentUser();
        document.getElementById(user ? "postForm" : "loginPrompt").hidden = false;

        const list = document.getElementById("postList");
        function render() {
            list.textContent = "";
            const posts = load();
            if (!posts.length) {
                const p = document.createElement("p");
                p.className = "page-intro";
                p.textContent = "No posts yet. Start the first conversation.";
                list.appendChild(p);
            }
            posts.slice().reverse().forEach((post) => {
                const card = document.createElement("div");
                card.className = "content-card";
                const h = document.createElement("h2"); h.textContent = post.title;
                const meta = document.createElement("p"); meta.className = "post-meta";
                meta.textContent = post.author + " - " + new Date(post.time).toLocaleDateString();
                const body = document.createElement("p"); body.textContent = post.body;
                card.append(h, meta, body);
                if (user && user.email === post.email) {
                    const del = document.createElement("button");
                    del.className = "logout-button"; del.type = "button"; del.textContent = "Delete";
                    del.onclick = () => { save(load().filter((x) => x.id !== post.id)); render(); };
                    card.appendChild(del);
                }
                list.appendChild(card);
            });
        }

        const form = document.getElementById("postForm");
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const posts = load();
            posts.push({
                id: Date.now(), email: user.email, author: user.name,
                title: document.getElementById("postTitle").value.trim(),
                body: document.getElementById("postBody").value.trim(),
                time: Date.now()
            });
            save(posts); form.reset(); render();
        });
        render();
    });
})();
