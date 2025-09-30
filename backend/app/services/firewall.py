#!/usr/bin/env python3
"""
ufw_manager.py

A Python3 module to manage UFW firewall rules and settings using subprocess.
Requires sudo/root privileges to run UFW commands.
"""

import subprocess
import shutil
import platform
from typing import Optional
import re


class UFWManager:
    def __init__(self):
        self.ufw_cmd = "ufw"

        # Ensure UFW is installed
        if not shutil.which(self.ufw_cmd):
            print("UFW not found, attempting to install...")
            self.install_ufw()

    # ---------------------- Internal Helpers ----------------------
    def _run(self, command: list[str]) -> str:
        """Run a ufw command and return output, raises CalledProcessError on failure."""
        try:
            result = subprocess.run(
                ["sudo", self.ufw_cmd] + command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=True
            )
            return result.stdout.strip()
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"UFW command failed: {e.stderr.strip()}") from e

    def install_ufw(self):
        """Install UFW using distro-specific package manager."""
        distro = platform.system().lower()
        install_cmd = None

        if distro == "linux":
            try:
                with open("/etc/os-release") as f:
                    os_info = f.read().lower()
                if "ubuntu" in os_info or "debian" in os_info:
                    subprocess.run(["sudo", "apt-get", "update", "-y"], check=False)
                    install_cmd = ["sudo", "apt-get", "install", "-y", "ufw"]
                elif "centos" in os_info or "rhel" in os_info or "rocky" in os_info:
                    install_cmd = ["sudo", "yum", "install", "-y", "ufw"]
                elif "fedora" in os_info:
                    install_cmd = ["sudo", "dnf", "install", "-y", "ufw"]
                elif "arch" in os_info:
                    install_cmd = ["sudo", "pacman", "-S", "--noconfirm", "ufw"]
            except FileNotFoundError:
                pass

        if install_cmd:
            print(f"Running install command: {' '.join(install_cmd)}")
            subprocess.run(install_cmd, check=True)
        else:
            raise EnvironmentError("Unsupported distro or cannot detect package manager. Please install UFW manually.")

    # ---------------------- General Controls ----------------------
    def enable(self) -> str:
        return self._run(["enable"])

    def disable(self) -> str:
        return self._run(["disable"])

    def reload(self) -> str:
        return self._run(["reload"])

    def status(self, verbose: bool = False) -> str:
        cmd = ["status"]
        if verbose:
            cmd.append("verbose")
        return self._run(cmd)

    def list_rules(self) -> list[dict]:
        """
        Parse `ufw status numbered` into a structured list of rules.
        Normalizes output so that:
        - "rule" always represents the destination/port/service
        - "from" always represents the source address
        """

        output = self._run(["status", "numbered"])
        rules = []

        # Regex: [num] <to/service> <action> [IN|OUT] <from/source>
        pattern = re.compile(
            r'^\[\s*(\d+)\]\s+(.+?)\s+(ALLOW|DENY|REJECT)\s+(IN|OUT)?\s+(.+)$'
        )

        for line in output.splitlines():
            line = line.strip()
            if not line.startswith("["):
                continue

            match = pattern.match(line)
            if not match:
                print("Unparsed line:", line)
                continue

            num = int(match.group(1))
            to_field = match.group(2).strip()
            action = match.group(3)
            direction = match.group(4) or ""
            from_field = match.group(5).strip()

            # --- Normalization ---
            # If 'to_field' looks like a port/protocol (e.g. "22/tcp", "80", "443/udp")
            # then treat it as the rule and 'from_field' as the source.
            if re.match(r'^\d+(/\w+)?$', to_field) or "/" in to_field or to_field.lower() in {"anywhere", "ipv6"}:
                rule = to_field
                source = from_field
            else:
                # Otherwise, UFW flipped it → swap
                rule = from_field
                source = to_field

            rules.append({
                "num": num,
                "rule": rule,
                "action": action,
                "direction": direction,
                "from": source
            })

        return rules


    # ---------------------- Global Rules ----------------------
    def allow_all(self) -> str:
        return self._run(["default", "allow"])

    def deny_all(self) -> str:
        return self._run(["default", "deny"])

    # ---------------------- IP Rules ----------------------
    def allow_ip(self, ip: str) -> str:
        return self._run(["allow", "from", ip])

    def block_ip(self, ip: str) -> str:
        return self._run(["deny", "from", ip])

    def remove_ip(self, ip: str) -> str:
        return self._run(["delete", "allow", "from", ip])

    # ---------------------- Port Rules ----------------------
    def allow_port(self, port: int, proto: Optional[str] = None) -> str:
        cmd = ["allow", f"{port}/{proto}"] if proto else ["allow", str(port)]
        return self._run(cmd)

    def block_port(self, port: int, proto: Optional[str] = None) -> str:
        cmd = ["deny", f"{port}/{proto}"] if proto else ["deny", str(port)]
        return self._run(cmd)

    def remove_port(self, port: int, proto: Optional[str] = None) -> str:
        cmd = ["delete", "allow", f"{port}/{proto}"] if proto else ["delete", "allow", str(port)]
        return self._run(cmd)

    # ---------------------- Protocol Rules ----------------------
    def allow_protocol(self, proto: str) -> str:
        """Allow common protocols like http, https, ssh, ftp, etc."""
        return self._run(["allow", proto])

    def block_protocol(self, proto: str) -> str:
        return self._run(["deny", proto])

    def remove_protocol(self, proto: str) -> str:
        return self._run(["delete", "allow", proto])

    # ---------------------- General Rule Removal ----------------------
    def remove_rule(self, rule: str) -> str:
        """
        Remove a rule by passing the same string used to allow/deny.
        Example: remove_rule("22/tcp") or remove_rule("from 192.168.1.10")
        """
        return self._run(["delete"] + rule.split())


if __name__ == "__main__":
    import sys

    manager = UFWManager()
    if len(sys.argv) < 2:
        print("Usage: python3 firewall.py <command> [args...]")
        sys.exit(1)

    command = sys.argv[1]
    args = sys.argv[2:]

    try:
        if command == "enable":
            print(manager.enable())
        elif command == "disable":
            print(manager.disable())
        elif command == "reload":
            print(manager.reload())
        elif command == "status":
            verbose = "--verbose" in args
            print(manager.status(verbose=verbose))
        elif command == "list":
            rules = manager.list_rules()
            for rule in rules:
                print(f"[{rule['num']}] {rule['rule']} {rule['action']} {rule['from']}")
        elif command == "allow_ip" and args:
            print(manager.allow_ip(args[0]))
        elif command == "block_ip" and args:
            print(manager.block_ip(args[0]))
        elif command == "remove_ip" and args:
            print(manager.remove_ip(args[0]))
        elif command == "allow_port" and args:
            port = int(args[0])
            proto = args[1] if len(args) > 1 else None
            print(manager.allow_port(port, proto))
        elif command == "block_port" and args:
            port = int(args[0])
            proto = args[1] if len(args) > 1 else None
            print(manager.block_port(port, proto))
        elif command == "remove_port" and args:
            port = int(args[0])
            proto = args[1] if len(args) > 1 else None
            print(manager.remove_port(port, proto))
        elif command == "allow_protocol" and args:
            print(manager.allow_protocol(args[0]))
        elif command == "block_protocol" and args:
            print(manager.block_protocol(args[0]))
        elif command == "remove_protocol" and args:
            print(manager.remove_protocol(args[0]))
        elif command == "remove_rule" and args:
            rule = " ".join(args)
            print(manager.remove_rule(rule))
        else:
            print(f"Unknown or incomplete command: {command}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)