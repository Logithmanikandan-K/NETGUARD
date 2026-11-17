
const { execFile } = require("child_process");

// Read incoming TCP connection attempts on this computer
function getPendingTcpConnections() {
    return new Promise((resolve, reject) => {

        const script = `
            $connections = @(
                Get-NetTCPConnection -State SynReceived -ErrorAction SilentlyContinue |
                Select-Object RemoteAddress, LocalPort, State
            )

            if ($connections.Count -gt 0) {
                $connections | ConvertTo-Json -Compress
            } else {
                Write-Output "[]"
            }
        `;

        execFile(
            "powershell.exe",
            ["-NoProfile", "-NonInteractive", "-Command", script],
            {
                timeout: 10000,
                windowsHide: true,
                encoding: "utf8"
            },
            (error, stdout, stderr) => {

                if (error) {
                    return reject(
                        new Error(stderr || error.message)
                    );
                }

                try {
                    const output = stdout.trim().replace(/^\uFEFF/, "");

                    if (!output) {
                        return resolve([]);
                    }

                    let connections = JSON.parse(output);

                    if (!Array.isArray(connections)) {
                        connections = [connections];
                    }

                    const events = connections
                        .filter(item =>
                            item.RemoteAddress &&
                            item.LocalPort
                        )
                        .map(item => ({
                            sourceIp: item.RemoteAddress,
                            targetPort: Number(item.LocalPort),
                            state: item.State
                        }));

                    resolve(events);

                } catch (parseError) {
                    reject(parseError);
                }
            }
        );
    });
}

module.exports = { getPendingTcpConnections };
