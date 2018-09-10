export const clientConstants = {
    'clients': {
        'akroma': {
            'version': '0.1.1',
            'platforms': {
                'linux': {
                    'x64': {
                        'download': {
                            'url': 'https://akromablob.blob.core.windows.net/build-binaries/linux/x64/0.1.1/geth',
                            'md5': 'd60af95f3a5b9d1045618a3dd8876fc7',
                        },
                        'bin': 'geth',
                        'extract_path': '/.akroma',
                    },
                    'x86': {
                        'download': {
                            'url': 'https://akromablob.blob.core.windows.net/build-binaries/linux/x32/0.1.1/geth',
                            'md5': '797edf313e593f6aeecb5df772626aa6',
                        },
                        'bin': 'geth',
                        'extract_path': '/.akroma',
                    },
                },
                'darwin': {
                    'x64': {
                        'download': {
                            'url': 'https://akromablob.blob.core.windows.net/build-binaries/darwin/x64/0.1.1/geth',
                            'md5': 'ed61a80aeeae2e8fe4f56932cf61edda',
                        },
                        'bin': 'geth',
                        'extract_path': '/.akroma',
                    },
                    'x86': {
                        'download': {
                            'url': 'https://akromablob.blob.core.windows.net/build-binaries/darwin/x32/0.1.1/geth',
                            'md5': '3d69407820c8d0ea6fb0406b1252d376',
                        },
                        'bin': 'geth',
                        'extract_path': '/.akroma',
                    },
                },
                'win32': {
                    'x64': {
                        'download': {
                            'url': 'https://akromablob.blob.core.windows.net/build-binaries/win32/x64/0.1.1/geth.exe',
                            'md5': '4fd0f7a0cb7f823708d427b7da81baac',
                        },
                        'bin': 'geth.exe',
                        'extract_path': '/.akroma',
                    },
                    'x32': {
                        'download': {
                            'url': 'https://akromablob.blob.core.windows.net/build-binaries/win32/x32/0.1.1/geth.exe',
                            'md5': '08067722fa94b09dd0d083519060cb9b',
                        },
                        'bin': 'geth.exe',
                        'extract_path': '/.akroma',
                    },
                },
            },
        },
    },
    'connection': {
        'default': 'http://localhost:8545',
        'remote': 'https://remote.akroma.io',
    },
};
