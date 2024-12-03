function toggleSidebar() {
    //document.getElementById('sidebar').style.width='0%'
    const sidebar = document.getElementById('sidebar');
    const openButton = document.getElementById('openSidebarBtn');

    sidebar.classList.toggle('sidebar-hidden');
    openButton.classList.toggle('hidden');
}