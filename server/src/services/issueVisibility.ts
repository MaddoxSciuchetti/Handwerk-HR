export function issueVisibleToViewer(viewerUserId: string) {
    return {
        OR: [{ assigneeOnly: false }, { assigneeUserId: viewerUserId }],
    };
}
