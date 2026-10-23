
"use strict";

const STORAGE_KEY = "campusflow-tasks-v1";

const starterTasks = [
    {
        id: 1,
        title: "Complete DevOps assignment",
        category: "Assignment",
        priority: "High",
        dueDate: "",
        status: "progress"
    },
    {
        id: 2,
        title: "Review GitHub Actions workflow",
        category: "Project",
        priority: "Medium",
        dueDate: "",
        status: "todo"
    },
    {
        id: 3,
        title: "Prepare project report",
        category: "Assignment",
        priority: "Low",
        dueDate: "",
        status: "completed"
    },
    {
        id: 4,
        title: "Revise software testing concepts",
        category: "Study",
        priority: "Medium",
        dueDate: "",
        status: "todo"
    }
];

const $ = (selector) => document.querySelector(selector);

const taskForm = $("#task-form");
const taskTitle = $("#task-title");
const taskCategory = $("#task-category");
const taskPriority = $("#task-priority");
const taskDate = $("#task-date");
const taskStatus = $("#task-status");
const taskList = $("#task-list");
const searchInput = $("#search-input");
const statusFilter = $("#status-filter");
const priorityFilter = $("#priority-filter");
const emptyMessage = $("#empty-message");

let tasks = loadTasks();

function loadTasks() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved !== null) {
            const parsed = JSON.parse(saved);

            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    } catch (error) {
        console.warn("Could not load saved tasks.", error);
    }

    return starterTasks.map(task => ({ ...task }));
}

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.warn("Could not save tasks in this browser.", error);
        alert("Your changes could not be saved in this browser.");
    }
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function formatDate(dateString) {
    if (!dateString) return "Not set";

    const parts = dateString.split("-");

    if (parts.length !== 3) return "Not set";

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getStatusLabel(status) {
    const labels = {
        todo: "To Do",
        progress: "In Progress",
        completed: "Completed"
    };

    return labels[status] || "To Do";
}

function renderTasks() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;
    const selectedPriority = priorityFilter.value;

    const filteredTasks = tasks.filter(task => {
        const matchesSearch =
            task.title.toLowerCase().includes(searchTerm) ||
            task.category.toLowerCase().includes(searchTerm);

        const matchesStatus =
            selectedStatus === "all" || task.status === selectedStatus;

        const matchesPriority =
            selectedPriority === "all" ||
            task.priority === selectedPriority;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    taskList.innerHTML = filteredTasks.map(task => `
        <tr>
            <td>
                <span class="task-name">${escapeHTML(task.title)}</span>
                <span class="task-category">${escapeHTML(task.category)}</span>
            </td>
            <td>
                <span class="badge priority-${escapeHTML(task.priority)}">
                    ${escapeHTML(task.priority)}
                </span>
            </td>
            <td>${escapeHTML(formatDate(task.dueDate))}</td>
            <td>
                <span class="badge status-${escapeHTML(task.status)}">
                    ${escapeHTML(getStatusLabel(task.status))}
                </span>
            </td>
            <td>
                <div class="action-group">
                    <button class="action-button" data-action="next"
                        data-id="${task.id}" aria-label="Advance task status">
                        ${task.status === "todo" ? "Start" :
                          task.status === "progress" ? "Complete" : "Reopen"}
                    </button>
                    <button class="action-button delete" data-action="delete"
                        data-id="${task.id}" aria-label="Delete task">
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    emptyMessage.hidden = filteredTasks.length !== 0;
    updateDashboard();
}

function updateDashboard() {
    const total = tasks.length;
    const todo = tasks.filter(task => task.status === "todo").length;
    const progress = tasks.filter(task => task.status === "progress").length;
    const completed = tasks.filter(task => task.status === "completed").length;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    $("#total-tasks").textContent = total;
    $("#todo-tasks").textContent = todo;
    $("#active-tasks").textContent = progress;
    $("#completed-tasks").textContent = completed;
    $("#progress-percent").textContent = `${percentage}%`;
    $("#progress-fill").style.width = `${percentage}%`;
    $("#progress-bar").setAttribute("aria-valuenow", percentage);

    $("#progress-caption").textContent = total === 0
        ? "Add your first task to get started."
        : `${completed} of ${total} tasks completed.`;
}

function resetForm() {
    taskForm.reset();
    taskForm.hidden = true;
}

$("#add-task-button").addEventListener("click", () => {
    taskForm.hidden = !taskForm.hidden;

    if (!taskForm.hidden) {
        taskTitle.focus();
    }
});

$("#cancel-task").addEventListener("click", resetForm);

taskForm.addEventListener("submit", event => {
    event.preventDefault();

    const title = taskTitle.value.trim();

    if (!title) {
        taskTitle.focus();
        return;
    }

    const newTask = {
        id: Date.now(),
        title,
        category: taskCategory.value,
        priority: taskPriority.value,
        dueDate: taskDate.value,
        status: taskStatus.value
    };

    tasks.unshift(newTask);
    saveTasks();
    resetForm();

    searchInput.value = "";
    statusFilter.value = "all";
    priorityFilter.value = "all";

    renderTasks();
});

taskList.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "delete") {
        const confirmed = confirm("Are you sure you want to delete this task?");

        if (!confirmed) return;

        tasks = tasks.filter(task => task.id !== id);
    }

    if (action === "next") {
        const task = tasks.find(item => item.id === id);

        if (!task) return;

        const nextStatus = {
            todo: "progress",
            progress: "completed",
            completed: "todo"
        };

        task.status = nextStatus[task.status] || "todo";
    }

    saveTasks();
    renderTasks();
});

searchInput.addEventListener("input", renderTasks);
statusFilter.addEventListener("change", renderTasks);
priorityFilter.addEventListener("change", renderTasks);

renderTasks();
